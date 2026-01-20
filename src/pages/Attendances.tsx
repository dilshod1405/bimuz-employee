import { useState, useEffect, useMemo } from "react"
import type { FormEvent } from "react"
import { Plus, Search, Calendar as CalendarIcon, Users, Filter, X, ChevronDown, ChevronUp, CheckCircle2, XCircle } from "lucide-react"
import { format } from "date-fns"
import { uz } from "date-fns/locale"
import { api, type Attendance, type ApiError, type Group, type Employee, type Student } from "@/lib/api"
import { useAuthStore } from "@/stores/authStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AttendanceFormDialog } from "@/components/attendances/AttendanceFormDialog"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

export default function Attendances() {
  const user = useAuthStore((state) => state.user)
  const { toast } = useToast()
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [mentors, setMentors] = useState<Employee[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedAttendance, setExpandedAttendance] = useState<number | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGroup, setSelectedGroup] = useState<string>("all")
  const [selectedMentor, setSelectedMentor] = useState<string>("all")
  const [selectedDate, setSelectedDate] = useState<string>("")

  // Check permissions
  const canCreate = user?.role === "mentor" || user?.role === "administrator" || user?.role === "dasturchi" || user?.role === "direktor"
  const canRead = !!user // All authenticated employees can read
  const isMentor = user?.role === "mentor"
  const userMentorId = isMentor ? user?.id : null

  // Form state
  const [formData, setFormData] = useState({
    group: null as number | null,
    date: "",
    mentor: null as number | null,
    participants: [] as number[],
  })

  useEffect(() => {
    if (canRead) {
      loadAttendances()
      loadGroups()
      loadMentors()
      loadStudents()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRead])

  const loadAttendances = async () => {
    try {
      setLoading(true)
      const mentorFilter = selectedMentor !== "all" ? parseInt(selectedMentor) : undefined
      const groupFilter = selectedGroup !== "all" ? parseInt(selectedGroup) : undefined
      
      const response = await api.getAttendances(
        searchQuery || undefined,
        groupFilter,
        mentorFilter,
        selectedDate || undefined
      )

      let attendancesList: Attendance[] = []
      if (response.results && Array.isArray(response.results)) {
        attendancesList = response.results
      } else if (response.data && Array.isArray(response.data)) {
        attendancesList = response.data
      }

      setAttendances(attendancesList)
    } catch (err) {
      const apiError = err as ApiError & { status?: number }
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: apiError.message || "Davomatlarni yuklashda xatolik yuz berdi",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadGroups = async () => {
    try {
      const response = await api.getGroups()
      let groupsList: Group[] = []
      if (response.results && Array.isArray(response.results)) {
        groupsList = response.results
      } else if (response.data && Array.isArray(response.data)) {
        groupsList = response.data
      }
      
      // If user is mentor, filter only their groups
      if (isMentor && user?.id) {
        groupsList = groupsList.filter(group => group.mentor === user.id)
      }
      
      setGroups(groupsList)
    } catch (err) {
      console.error("Failed to load groups:", err)
    }
  }

  const loadMentors = async () => {
    try {
      const response = await api.getEmployees()
      let employeesList: Employee[] = []
      if (response.results && Array.isArray(response.results)) {
        employeesList = response.results
      } else if (response.data && Array.isArray(response.data)) {
        employeesList = response.data
      }
      // Filter only mentors
      const mentorsList = employeesList.filter(emp => emp.role === "mentor")
      setMentors(mentorsList)
    } catch (err) {
      console.error("Failed to load mentors:", err)
    }
  }

  const loadStudents = async () => {
    try {
      const response = await api.getStudents()
      let studentsList: Student[] = []
      if (response.results && Array.isArray(response.results)) {
        studentsList = response.results
      } else if (response.data && Array.isArray(response.data)) {
        studentsList = response.data
      }
      setStudents(studentsList)
    } catch (err) {
      console.error("Failed to load students:", err)
    }
  }

  // Group attendances by group
  const groupedAttendances = useMemo(() => {
    const grouped: Record<number, Attendance[]> = {}
    
    attendances.forEach(attendance => {
      const groupId = attendance.group
      if (!grouped[groupId]) {
        grouped[groupId] = []
      }
      grouped[groupId].push(attendance)
    })

    // Sort each group's attendances by date (newest first)
    Object.keys(grouped).forEach(key => {
      grouped[parseInt(key)].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    })

    return grouped
  }, [attendances])

  // Get group info for display
  const getGroupInfo = (groupId: number) => {
    return groups.find(g => g.id === groupId)
  }

  const handleSearch = () => {
    loadAttendances()
  }

  const handleFilterChange = () => {
    loadAttendances()
  }

  const handleCreate = () => {
    setEditingAttendance(null)
    setFormData({
      group: isMentor && groups.length > 0 ? groups[0].id : null,
      date: new Date().toISOString().split('T')[0],
      mentor: isMentor ? (user?.id || null) : null,
      participants: [],
    })
    setFormError(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (attendance: Attendance) => {
    setEditingAttendance(attendance)
    setFormData({
      group: attendance.group,
      date: attendance.date,
      mentor: attendance.mentor || null,
      participants: attendance.participants || [],
    })
    setFormError(null)
    setIsDialogOpen(true)
  }

  const handleFormChange = (field: string, value: string | number | number[] | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsSubmitting(true)

    try {
      if (editingAttendance) {
        // Validate mentor exists before sending
        const mentorId = formData.mentor && mentors.some(m => m.id === formData.mentor)
          ? formData.mentor
          : undefined
        
        await api.updateAttendance(editingAttendance.id, {
          group: formData.group || undefined,
          date: formData.date || undefined,
          mentor: mentorId,
          participants: formData.participants || [],
        })
        toast({
          title: "Muvaffaqiyatli",
          description: "Davomat yangilandi.",
        })
      } else {
        // Validate mentor exists before sending
        const mentorId = formData.mentor && mentors.some(m => m.id === formData.mentor) 
          ? formData.mentor 
          : undefined
        
        await api.createAttendance({
          group: formData.group!,
          date: formData.date,
          mentor: mentorId,
          participants: formData.participants || [],
        })
        toast({
          title: "Muvaffaqiyatli",
          description: "Yangi davomat yaratildi.",
        })
      }
      setIsDialogOpen(false)
      loadAttendances()
    } catch (err) {
      const apiError = err as ApiError & { status?: number }
      let errorMessage = "Xatolik yuz berdi"
      if (apiError.errors) {
        const errorMessages = Object.values(apiError.errors).flat()
        errorMessage = errorMessages.join(", ")
      } else if (apiError.message) {
        errorMessage = apiError.message
      }
      setFormError(errorMessage)
      toast({
        title: "Xatolik",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "d MMMM yyyy, EEEE", { locale: uz })
    } catch {
      return dateString
    }
  }

  const formatTime = (timeString: string) => {
    try {
      // Time format: "HH:mm:ss" or "HH:mm:ss.microseconds"
      const timeOnly = timeString.split('.')[0] // Remove microseconds
      const [hours, minutes] = timeOnly.split(':')
      return `${hours}:${minutes}`
    } catch {
      return timeString.split('.')[0] || timeString
    }
  }

  // Get students for a group
  const getGroupStudents = (groupId: number): Student[] => {
    return students.filter(student => student.group === groupId)
  }

  // Get attended and not attended students
  const getAttendanceStatus = (attendance: Attendance) => {
    const groupStudents = getGroupStudents(attendance.group)
    const participantIds = new Set(attendance.participants || [])
    
    const attended = groupStudents.filter(s => participantIds.has(s.id))
    const notAttended = groupStudents.filter(s => !participantIds.has(s.id))
    
    return { attended, notAttended, total: groupStudents.length }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedGroup("all")
    setSelectedMentor("all")
    setSelectedDate("")
    setTimeout(() => loadAttendances(), 100)
  }

  const hasActiveFilters = searchQuery || selectedGroup !== "all" || selectedMentor !== "all" || selectedDate

  if (!canRead) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Sizda bu sahifani ko'rish uchun ruxsat yo'q.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Davomatlar</h1>
        {canCreate && (
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Yangi davomat
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-lg">Qidiruv va Filtrlar</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative flex-1 lg:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Guruh nomi, mentor bo'yicha qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>

            <Select value={selectedGroup} onValueChange={(value) => { setSelectedGroup(value); handleFilterChange(); }}>
              <SelectTrigger>
                <SelectValue placeholder="Guruh tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha guruhlar</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id.toString()}>
                    {group.speciality_display} - {group.dates_display}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedMentor} onValueChange={(value) => { setSelectedMentor(value); handleFilterChange(); }}>
              <SelectTrigger>
                <SelectValue placeholder="Mentor tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha mentorlar</SelectItem>
                {mentors.map((mentor) => (
                  <SelectItem key={mentor.id} value={mentor.id.toString()}>
                    {mentor.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(new Date(selectedDate), "PPP")
                    ) : (
                      <span>Sana bo'yicha filter</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate ? new Date(selectedDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(format(date, "yyyy-MM-dd"))
                          handleFilterChange()
                        } else {
                          setSelectedDate("")
                          handleFilterChange()
                        }
                      }}
                      initialFocus
                      captionLayout="dropdown"
                      fromYear={new Date().getFullYear() - 1}
                      toYear={new Date().getFullYear() + 1}
                      locale={uz}
                      weekStartsOn={1}
                    />
                </PopoverContent>
              </Popover>
              {hasActiveFilters && (
                <Button variant="outline" size="icon" onClick={clearFilters} title="Filtrlarni tozalash">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grouped Attendances */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Yuklanmoqda...</p>
          </CardContent>
        </Card>
      ) : Object.keys(groupedAttendances).length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground text-center">Davomatlar topilmadi</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(groupedAttendances).map(([groupId, groupAttendances]) => {
            const group = getGroupInfo(parseInt(groupId))
            if (!group) return null

            return (
              <Card key={groupId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{group.speciality_display}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {group.dates_display} • {group.time} • {groupAttendances.length} ta davomat
                      </p>
                    </div>
                    {group.mentor_name && (
                      <Badge variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        {group.mentor_name}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {groupAttendances.map((attendance) => {
                      const isExpanded = expandedAttendance === attendance.id
                      const { attended, notAttended, total } = getAttendanceStatus(attendance)
                      
                      return (
                        <div
                          key={attendance.id}
                          className="border rounded-lg overflow-hidden"
                        >
                          <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="flex items-center gap-2 text-sm min-w-[200px]">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{formatDate(attendance.date)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{formatTime(attendance.time)}</span>
                              </div>
                              {attendance.mentor_name && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <span>{attendance.mentor_name}</span>
                                </div>
                              )}
                              <Badge variant="outline">
                                {attendance.participants_count} / {total} ishtirokchi
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedAttendance(isExpanded ? null : attendance.id)}
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="h-4 w-4 mr-1" />
                                    Yopish
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-4 w-4 mr-1" />
                                    Ro'yxat
                                  </>
                                )}
                              </Button>
                              {canCreate && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(attendance)}
                                >
                                  Tahrirlash
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="border-t bg-muted/30 p-4 space-y-4">
                              {/* Attended Students */}
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  <h4 className="font-medium text-sm">
                                    Qatnashgan talabalar ({attended.length})
                                  </h4>
                                </div>
                                {attended.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {attended.map((student) => (
                                      <div
                                        key={student.id}
                                        className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded text-sm"
                                      >
                                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                                        <span className="font-medium">{student.full_name}</span>
                                        {student.phone && (
                                          <span className="text-muted-foreground text-xs">({student.phone})</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">Qatnashgan talabalar yo'q</p>
                                )}
                              </div>

                              {/* Not Attended Students */}
                              {notAttended.length > 0 && (
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <XCircle className="h-4 w-4 text-red-600" />
                                    <h4 className="font-medium text-sm">
                                      Qatnashmagan talabalar ({notAttended.length})
                                    </h4>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {notAttended.map((student) => (
                                      <div
                                        key={student.id}
                                        className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded text-sm"
                                      >
                                        <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                                        <span className="font-medium">{student.full_name}</span>
                                        {student.phone && (
                                          <span className="text-muted-foreground text-xs">({student.phone})</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

          <AttendanceFormDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            editingAttendance={editingAttendance}
            formData={formData}
            error={formError}
            onChange={handleFormChange}
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
            groups={groups}
            isMentor={isMentor}
            userMentorId={userMentorId}
            userRole={user?.role}
            mentors={mentors}
          />
    </div>
  )
}
