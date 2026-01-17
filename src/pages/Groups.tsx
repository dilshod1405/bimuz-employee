import { useState, useEffect } from "react"
import type { FormEvent } from "react"
import { Plus, Edit2, Trash2, MoreVertical } from "lucide-react"
import { api, type Group, type ApiError, type Employee } from "@/lib/api"
import { useAuthStore } from "@/stores/authStore"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GroupFormDialog } from "@/components/groups/GroupFormDialog"
import { DeleteDialog } from "@/components/common/DeleteDialog"
import { useToast } from "@/hooks/use-toast"

export default function Groups() {
  const user = useAuthStore((state) => state.user)
  const { toast } = useToast()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mentors, setMentors] = useState<Employee[]>([])

  // Check permissions
  const canCRUD = user?.role === "dasturchi" || user?.role === "direktor" || user?.role === "administrator"
  const canRead = !!user // Any authenticated employee can read (Mentor sees only their groups)

  // Form state
  const [formData, setFormData] = useState({
    speciality_id: "revit_architecture",
    dates: "mon_wed_fri",
    time: "09:00",
    starting_date: "",
    seats: 20,
    price: "0",
    total_lessons: null as number | null,
    mentor: null as number | null,
    is_active: true,
  })

  useEffect(() => {
    if (canRead) {
      loadGroups()
      if (canCRUD) {
        loadMentors()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRead, canCRUD])

  const loadGroups = async () => {
    try {
      setLoading(true)
      setFormError(null)
      const response = await api.getGroups()

      let groupsList: Group[] = []
      if (response.results && Array.isArray(response.results)) {
        groupsList = response.results
      } else if (response.data && Array.isArray(response.data)) {
        groupsList = response.data
      }

      setGroups(groupsList)
    } catch (err) {
      const apiError = err as ApiError & { status?: number }
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: apiError.message || "Guruhlarni yuklashda xatolik yuz berdi",
      })
    } finally {
      setLoading(false)
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
      // Silently fail - mentors are optional
      console.error("Failed to load mentors:", err)
    }
  }

  const handleCreate = () => {
    setEditingGroup(null)
    setFormData({
      speciality_id: "revit_architecture",
      dates: "mon_wed_fri",
      time: "09:00",
      starting_date: "",
      seats: 20,
      price: "0",
      total_lessons: null,
      mentor: null,
      is_active: true,
    })
    setFormError(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (group: Group) => {
    setEditingGroup(group)
    setFormData({
      speciality_id: group.speciality_id,
      dates: group.dates,
      time: group.time,
      starting_date: group.starting_date || "",
      seats: group.seats,
      price: group.price,
      total_lessons: group.total_lessons || null,
      mentor: group.mentor || null,
      is_active: group.is_active,
    })
    setFormError(null)
    setIsDialogOpen(true)
  }

  const handleFormChange = (field: string, value: string | number | boolean | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsSubmitting(true)

    try {
      if (editingGroup) {
        // Update
        await api.updateGroup(editingGroup.id, {
          speciality_id: formData.speciality_id,
          dates: formData.dates,
          time: formData.time,
          starting_date: formData.starting_date || null,
          seats: formData.seats,
          price: formData.price,
          total_lessons: formData.total_lessons,
          mentor: formData.mentor,
          is_active: formData.is_active,
        })
        toast({
          title: "Muvaffaqiyatli",
          description: "Guruh ma'lumotlari yangilandi.",
        })
      } else {
        // Create
        await api.createGroup({
          speciality_id: formData.speciality_id,
          dates: formData.dates,
          time: formData.time,
          starting_date: formData.starting_date || null,
          seats: formData.seats,
          price: formData.price,
          total_lessons: formData.total_lessons,
          mentor: formData.mentor,
        })
        toast({
          title: "Muvaffaqiyatli",
          description: "Yangi guruh qo'shildi.",
        })
      }
      setIsDialogOpen(false)
      loadGroups()
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

  const handleDeleteClick = (group: Group) => {
    setGroupToDelete(group)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!groupToDelete) return

    setIsSubmitting(true)
    try {
      await api.deleteGroup(groupToDelete.id)
      toast({
        title: "Muvaffaqiyatli",
        description: "Guruh muvaffaqiyatli o'chirildi.",
      })
      setDeleteConfirmOpen(false)
      setGroupToDelete(null)
      loadGroups()
    } catch (err) {
      const apiError = err as ApiError & { status?: number }
      const errorMessage = apiError.message || "Guruhni o'chirishda xatolik yuz berdi"
      toast({
        title: "Xatolik",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price)
    return new Intl.NumberFormat('uz-UZ').format(numPrice)
  }

  const formatStartingDate = (startingDate: string | null | undefined) => {
    if (!startingDate) {
      return "-"
    }

    const date = new Date(startingDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to midnight for accurate comparison
    date.setHours(0, 0, 0, 0)

    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      // Date has passed
      return "Boshlangan"
    } else if (diffDays === 0) {
      // Today
      return "Bugun boshlanadi"
    } else {
      // Future date
      return `${diffDays} kun qoldi`
    }
  }

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
        <h1 className="text-2xl font-semibold">Guruhlar</h1>
        {canCRUD && (
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Yangi guruh
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-4 p-6">
              <div className="h-12 bg-muted animate-pulse rounded" />
              <div className="h-12 bg-muted animate-pulse rounded" />
              <div className="h-12 bg-muted animate-pulse rounded" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium">Mutaxassislik</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Kunlar</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Vaqt</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Boshlanish</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">O'rinlar</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Narx</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Mentor</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Holat</th>
                    {canCRUD && (
                      <th className="px-4 py-3 text-right text-sm font-medium">Amallar</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {groups.length === 0 ? (
                    <tr>
                      <td colSpan={canCRUD ? 9 : 8} className="px-4 py-8 text-center text-muted-foreground">
                        Guruhlar topilmadi
                      </td>
                    </tr>
                  ) : (
                    groups.map((group) => (
                      <tr key={group.id} className="border-b hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm font-medium">{group.speciality_display}</td>
                        <td className="px-4 py-3 text-sm">{group.dates_display}</td>
                        <td className="px-4 py-3 text-sm">{group.time}</td>
                        <td className="px-4 py-3 text-sm">{formatStartingDate(group.starting_date)}</td>
                        <td className="px-4 py-3 text-sm">
                          {group.current_students_count || 0} / {group.seats}
                        </td>
                        <td className="px-4 py-3 text-sm">{formatPrice(group.price)} so'm</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {group.mentor_name || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              group.is_active
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {group.is_active ? "Faol" : "Nofaol"}
                          </span>
                        </td>
                        {canCRUD && (
                          <td className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(group)}>
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  Tahrirlash
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(group)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  O'chirish
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <GroupFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingGroup={editingGroup}
        formData={formData}
        error={formError}
        mentors={mentors}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />

      <DeleteDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        itemName={groupToDelete ? `${groupToDelete.speciality_display} - ${groupToDelete.dates_display}` : null}
        title="Guruhni o'chirish"
        onConfirm={handleDeleteConfirm}
        isLoading={isSubmitting}
      />
    </div>
  )
}
