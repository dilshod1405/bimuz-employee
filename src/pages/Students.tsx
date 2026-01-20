import { useState, useEffect } from "react"
import type { FormEvent } from "react"
import { Plus, Search, Edit2, Trash2, MoreVertical } from "lucide-react"
import { api, type Student, type ApiError, type Group } from "@/lib/api"
import { useAuthStore } from "@/stores/authStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StudentFormDialog } from "@/components/students/StudentFormDialog"
import { DeleteDialog } from "@/components/common/DeleteDialog"
import { useToast } from "@/hooks/use-toast"

export default function Students() {
  const user = useAuthStore((state) => state.user)
  const { toast } = useToast()
  const [students, setStudents] = useState<Student[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentSearchTerm, setCurrentSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check permissions
  const canCRUD = user?.role === "dasturchi" || user?.role === "administrator"
  const canRead = !!user // Any authenticated employee can read

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    password_confirm: "",
    full_name: "",
    phone: "",
    passport_serial_number: "",
    birth_date: "",
    source: "instagram",
    address: "",
    inn: "",
    pinfl: "",
    group: null as number | null,
    certificate: null as File | null,
    is_active: true,
  })

  useEffect(() => {
    if (canRead) {
      loadStudents(currentSearchTerm)
      loadGroups()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRead, currentSearchTerm])

  const loadStudents = async (searchTerm: string = "") => {
    try {
      setLoading(true)
      const response = await api.getStudents(searchTerm)
      
      let studentsList: Student[] = []
      if (response.results && Array.isArray(response.results)) {
        studentsList = response.results
      } else if (response.data && Array.isArray(response.data)) {
        studentsList = response.data
      }
      
      setStudents(studentsList)
    } catch (err) {
      const apiError = err as ApiError & { status?: number }
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: apiError.message || "Talabalarni yuklashda xatolik yuz berdi",
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
      setGroups(groupsList)
    } catch (err) {
      console.error("Failed to load groups:", err)
    }
  }

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    setCurrentSearchTerm(searchQuery)
  }

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(e)
    }
  }

  const handleCreate = () => {
    setEditingStudent(null)
    setFormData({
      email: "",
      password: "",
      password_confirm: "",
      full_name: "",
      phone: "",
      passport_serial_number: "",
      birth_date: "",
      source: "instagram",
      address: "",
      inn: "",
      pinfl: "",
      group: null,
      certificate: null,
      is_active: true,
    })
    setFormError(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setFormData({
      email: student.email,
      password: "",
      password_confirm: "",
      full_name: student.full_name,
      phone: student.phone,
      passport_serial_number: student.passport_serial_number,
      birth_date: student.birth_date,
      source: student.source,
      address: student.address || "",
      inn: student.inn || "",
      pinfl: student.pinfl || "",
      group: student.group || null,
      certificate: null,
      is_active: student.is_active ?? true,
    })
    setFormError(null)
    setIsDialogOpen(true)
  }

  const handleFormChange = (field: string, value: string | File | number | boolean | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsSubmitting(true)

    try {
      if (editingStudent) {
        // Update
        await api.updateStudent(editingStudent.id, {
          full_name: formData.full_name,
          phone: formData.phone,
          passport_serial_number: formData.passport_serial_number,
          birth_date: formData.birth_date,
          source: formData.source,
          address: formData.address,
          inn: formData.inn,
          pinfl: formData.pinfl,
          group: formData.group,
          certificate: formData.certificate,
          is_active: formData.is_active,
        })
        toast({
          title: "Muvaffaqiyatli",
          description: "Talaba ma'lumotlari yangilandi.",
        })
      } else {
        // Create
        await api.createStudent({
          email: formData.email,
          password: formData.password,
          password_confirm: formData.password_confirm,
          full_name: formData.full_name,
          phone: formData.phone,
          passport_serial_number: formData.passport_serial_number,
          birth_date: formData.birth_date,
          source: formData.source,
          address: formData.address,
          inn: formData.inn,
          pinfl: formData.pinfl,
        })
        toast({
          title: "Muvaffaqiyatli",
          description: "Yangi talaba qo'shildi.",
        })
      }
      setIsDialogOpen(false)
      loadStudents(currentSearchTerm)
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

  const handleDeleteClick = (student: Student) => {
    setStudentToDelete(student)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return

    try {
      await api.deleteStudent(studentToDelete.id)
      toast({
        title: "Muvaffaqiyatli",
        description: "Talaba muvaffaqiyatli o'chirildi.",
      })
      setDeleteConfirmOpen(false)
      setStudentToDelete(null)
      loadStudents(currentSearchTerm)
    } catch (err) {
      const apiError = err as ApiError & { status?: number }
      const errorMessage = apiError.message || "Talabani o'chirishda xatolik yuz berdi"
      toast({
        title: "Xatolik",
        description: errorMessage,
        variant: "destructive",
      })
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
        <h1 className="text-2xl font-semibold">Talabalar</h1>
        {canCRUD && (
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Yangi talaba
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <form onSubmit={handleSearch} className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={loading}>
              <Search className="h-4 w-4" />
              Qidirish
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <div className="h-12 bg-muted animate-pulse rounded" />
              <div className="h-12 bg-muted animate-pulse rounded" />
              <div className="h-12 bg-muted animate-pulse rounded" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium">Ism</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Telefon</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Manbaa</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Holat</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Guruh</th>
                    {canCRUD && (
                      <th className="px-4 py-3 text-right text-sm font-medium">Amallar</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={canCRUD ? 7 : 6} className="px-4 py-8 text-center text-muted-foreground">
                        Talabalar topilmadi
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.id} className="border-b hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm font-medium">{student.full_name}</td>
                        <td className="px-4 py-3 text-sm">{student.email}</td>
                        <td className="px-4 py-3 text-sm">{student.phone}</td>
                        <td className="px-4 py-3 text-sm">{student.source_display || "-"}</td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              student.is_active
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {student.is_active ? "Faol" : "Nofaol"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {student.group_name || "-"}
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
                                <DropdownMenuItem onClick={() => handleEdit(student)}>
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  Tahrirlash
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(student)}
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

      <StudentFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingStudent={editingStudent}
        formData={formData}
        error={formError}
        groups={groups}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />

      <DeleteDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        itemName={studentToDelete?.full_name || null}
        title="Talabani o'chirish"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
