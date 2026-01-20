import type { FormEvent } from "react"
import type { Attendance, Group, Student, Employee } from "@/lib/api"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useState, useEffect, useMemo } from "react"
import { Loader2, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { uz } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface AttendanceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingAttendance: Attendance | null
  formData: {
    group: number | null
    date: string
    mentor: number | null
    participants: number[]
  }
  error: string | null
  onChange: (field: string, value: string | number | number[] | null) => void
  onSubmit: (e: FormEvent) => void
  isLoading?: boolean
  groups: Group[]
  isMentor: boolean
  userMentorId: number | null | undefined
  userRole?: string | null
  mentors?: Employee[]
}

export function AttendanceFormDialog({
  open,
  onOpenChange,
  editingAttendance,
  formData,
  error,
  onChange,
  onSubmit,
  isLoading = false,
  groups,
  isMentor,
  userMentorId,
  userRole,
  mentors = [],
}: AttendanceFormDialogProps) {
  const [groupStudents, setGroupStudents] = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)

  // Load students when group changes
  useEffect(() => {
    if (formData.group) {
      loadGroupStudents(formData.group)
    } else {
      setGroupStudents([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.group])

  const loadGroupStudents = async (groupId: number) => {
    try {
      setLoadingStudents(true)
      const groupResponse = await api.getGroup(groupId)
      const group = groupResponse.data

      // Get all students and filter by group
      const studentsResponse = await api.getStudents()
      let allStudents: Student[] = []
      if (studentsResponse.results && Array.isArray(studentsResponse.results)) {
        allStudents = studentsResponse.results
      } else if (studentsResponse.data && Array.isArray(studentsResponse.data)) {
        allStudents = studentsResponse.data
      }

      // Filter students in this group
      const studentsInGroup = allStudents.filter(student => student.group === groupId)
      setGroupStudents(studentsInGroup)
    } catch (err) {
      console.error("Failed to load group students:", err)
      setGroupStudents([])
    } finally {
      setLoadingStudents(false)
    }
  }

  // Check if user can select mentor
  const canSelectMentor = userRole === "dasturchi" || userRole === "direktor" || userRole === "administrator"

  // Filter groups based on mentor
  const availableGroups = useMemo(() => {
    if (isMentor) {
      // Mentor sees only their groups
      return groups.filter(group => group.mentor === userMentorId)
    } else if (canSelectMentor && formData.mentor) {
      // If mentor is selected, show only that mentor's groups
      return groups.filter(group => group.mentor === formData.mentor)
    } else {
      // Show all groups
      return groups
    }
  }, [groups, isMentor, userMentorId, canSelectMentor, formData.mentor])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>
            {editingAttendance ? "Davomatni tahrirlash" : "Yangi davomat qo'shish"}
          </DialogTitle>
          <DialogDescription>
            {editingAttendance
              ? "Davomat ma'lumotlarini yangilang"
              : "Yangi davomat ma'lumotlarini kiriting"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto px-6 pb-4 flex-1">
            {error && (
              <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <FieldGroup>
              {canSelectMentor && !isMentor && (
                <Field>
                  <FieldLabel htmlFor="mentor">Mentor (ixtiyoriy)</FieldLabel>
                  <Select
                    value={formData.mentor?.toString() || undefined}
                    onValueChange={(value) => {
                      const mentorId = value ? parseInt(value) : null
                      onChange("mentor", mentorId)
                      
                      // If group is selected and doesn't belong to new mentor, clear it
                      if (formData.group && mentorId) {
                        const selectedGroup = groups.find(g => g.id === formData.group)
                        if (selectedGroup && selectedGroup.mentor !== mentorId) {
                          onChange("group", null)
                        }
                      }
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="mentor">
                      <SelectValue placeholder="Mentor tanlang (ixtiyoriy)" />
                    </SelectTrigger>
                    <SelectContent>
                      {mentors.map((mentor) => (
                        <SelectItem key={mentor.id} value={mentor.id.toString()}>
                          {mentor.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Mentor tanlangan bo'lsa, faqat uning guruhlari ko'rsatiladi
                  </p>
                </Field>
              )}

              <Field>
                <FieldLabel htmlFor="group">Guruh *</FieldLabel>
                <Select
                  value={formData.group?.toString() || ""}
                  onValueChange={(value) => {
                    const groupId = value ? parseInt(value) : null
                    onChange("group", groupId)
                    
                    // Auto-select mentor from group (only if mentor is not manually selected)
                    if (groupId && !canSelectMentor) {
                      const selectedGroup = groups.find(g => g.id === groupId)
                      if (selectedGroup && selectedGroup.mentor) {
                        // Validate that mentor exists in the mentors list
                        const mentorExists = mentors.some(m => m.id === selectedGroup.mentor)
                        if (mentorExists) {
                          onChange("mentor", selectedGroup.mentor)
                        } else {
                          // If mentor doesn't exist, set to null
                          onChange("mentor", null)
                        }
                      } else {
                        onChange("mentor", null)
                      }
                    }
                  }}
                  required
                  disabled={isLoading || isMentor}
                >
                  <SelectTrigger id="group">
                    <SelectValue placeholder="Guruh tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableGroups.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        {formData.mentor ? "Bu mentorning guruhlari topilmadi" : "Guruhlar topilmadi"}
                      </div>
                    ) : (
                      availableGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.speciality_display} - {group.dates_display} ({group.time})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {isMentor && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Faqat sizga tegishli guruhlar ko'rsatilmoqda
                  </p>
                )}
                {canSelectMentor && formData.mentor && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Tanlangan mentorning guruhlari ko'rsatilmoqda
                  </p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="date">Sana *</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.date && "text-muted-foreground"
                      )}
                      disabled={isLoading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? (
                        format(new Date(formData.date), "d MMMM yyyy, EEEE", { locale: uz })
                      ) : (
                        <span>Sana tanlang</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.date ? new Date(formData.date) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          onChange("date", format(date, "yyyy-MM-dd"))
                        } else {
                          onChange("date", "")
                        }
                      }}
                      disabled={isLoading}
                      initialFocus
                      captionLayout="dropdown"
                      fromYear={new Date().getFullYear() - 1}
                      toYear={new Date().getFullYear() + 1}
                      locale={uz}
                      weekStartsOn={1}
                    />
                  </PopoverContent>
                </Popover>
              </Field>


              <Field>
                <FieldLabel>Ishtirokchilar</FieldLabel>
                {loadingStudents ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2 text-sm text-muted-foreground">Talabalar yuklanmoqda...</span>
                  </div>
                ) : groupStudents.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4">
                    {formData.group
                      ? "Bu guruhda talabalar mavjud emas"
                      : "Avval guruhni tanlang"}
                  </p>
                ) : (
                  <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                    <div className="space-y-2">
                      {groupStudents.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded"
                        >
                          <Checkbox
                            id={`student-${student.id}`}
                            checked={formData.participants?.includes(student.id) || false}
                            onChange={(e) => {
                              const currentParticipants = formData.participants || []
                              if (e.target.checked) {
                                onChange('participants', [...currentParticipants, student.id])
                              } else {
                                onChange('participants', currentParticipants.filter(id => id !== student.id))
                              }
                            }}
                            disabled={isLoading}
                          />
                          <label
                            htmlFor={`student-${student.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                          >
                            {student.full_name}
                          </label>
                          {student.phone && (
                            <span className="text-xs text-muted-foreground">{student.phone}</span>
                          )}
                        </div>
                      ))}
                    </div>
                    {formData.participants && formData.participants.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          Tanlangan: {formData.participants.length} ta
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Field>
            </FieldGroup>
          </div>
          <DialogFooter className="px-6 pb-6 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Bekor qilish
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saqlanmoqda..." : editingAttendance ? "Saqlash" : "Qo'shish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
