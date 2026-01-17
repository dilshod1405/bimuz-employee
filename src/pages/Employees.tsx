import { useState, useEffect } from "react"
import type { FormEvent } from "react"
import { Plus, Search, Edit2, Trash2, MoreVertical } from "lucide-react"
import { api, type Employee, type ApiError } from "@/lib/api"
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
import { EmployeeFormDialog } from "@/components/employees/EmployeeFormDialog"
import { DeleteDialog } from "@/components/common/DeleteDialog"
import { EmployeesTableSkeleton } from "@/components/employees/EmployeesTableSkeleton"
import { useToast } from "@/hooks/use-toast"

export default function Employees() {
  const user = useAuthStore((state) => state.user)
  const { toast } = useToast()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check if user is developer
  const isDeveloper = user?.role === "dasturchi"

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    password_confirm: "",
    full_name: "",
    role: "mentor",
    professionality: "",
    avatar: null as File | null,
    is_active: true,
  })

  useEffect(() => {
    if (isDeveloper) {
      loadEmployees()
    }
  }, [isDeveloper])

  const loadEmployees = async (search?: string) => {
    try {
      setLoading(true)
      const response = await api.getEmployees(search)
      
      // Handle both paginated and non-paginated responses
      let employeesList: Employee[] = []
      
      // Pagination format: { count, next, previous, results: [...] }
      if (response.results && Array.isArray(response.results)) {
        employeesList = response.results
      }
      // Custom success_response format: { success: true, data: [...] }
      else if (response.data && Array.isArray(response.data)) {
        employeesList = response.data
      }
      
      setEmployees(employeesList)
    } catch (err) {
      const apiError = err as ApiError & { status?: number }
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: apiError.message || "Xodimlarni yuklashda xatolik yuz berdi",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadEmployees(searchQuery)
  }

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleCreate = () => {
    setEditingEmployee(null)
    setFormData({
      email: "",
      first_name: "",
      last_name: "",
      password: "",
      password_confirm: "",
      full_name: "",
      role: "mentor",
      professionality: "",
      avatar: null,
      is_active: true,
    })
    setFormError(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData({
      email: employee.email,
      first_name: employee.first_name,
      last_name: employee.last_name,
      password: "",
      password_confirm: "",
      full_name: employee.full_name,
      role: employee.role,
      professionality: employee.professionality || "",
      avatar: null,
      is_active: employee.is_active ?? true,
    })
    setFormError(null)
    setIsDialogOpen(true)
  }

  const handleFormChange = (field: string, value: string | File | boolean | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsSubmitting(true)

    try {
      if (editingEmployee) {
        // Update
        await api.updateEmployee(editingEmployee.id, {
          full_name: formData.full_name,
          role: formData.role,
          professionality: formData.professionality || null,
          is_active: formData.is_active,
          avatar: formData.avatar,
        })
        toast({
          title: "Muvaffaqiyatli",
          description: "Xodim ma'lumotlari yangilandi.",
        })
      } else {
        // Create - generate full_name from first_name and last_name if not provided
        const fullName = formData.full_name.trim() || `${formData.first_name.trim()} ${formData.last_name.trim()}`.trim()
        await api.createEmployee({
          ...formData,
          full_name: fullName,
        })
        toast({
          title: "Muvaffaqiyatli",
          description: "Yangi xodim qo'shildi.",
        })
      }
      setIsDialogOpen(false)
      loadEmployees()
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

  const handleDeleteClick = (employee: Employee) => {
    setEmployeeToDelete(employee)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return

    try {
      await api.deleteEmployee(employeeToDelete.id)
      toast({
        title: "Muvaffaqiyatli",
        description: "Xodim muvaffaqiyatli o'chirildi.",
      })
      setDeleteConfirmOpen(false)
      setEmployeeToDelete(null)
      loadEmployees(currentSearchTerm) // Reload employees list
    } catch (err) {
      const apiError = err as ApiError & { status?: number }
      const errorMessage = apiError.message || "Xodimni o'chirishda xatolik yuz berdi"
      toast({
        title: "Xatolik",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // Employees are already filtered by backend
  const filteredEmployees = employees

  if (!isDeveloper) {
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
        <h1 className="text-2xl font-semibold">Xodimlar</h1>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Yangi xodim
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
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
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4" />
              Qidirish
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <EmployeesTableSkeleton rows={5} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium">Ism</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Mutaxassislik</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Holat</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        Xodimlar topilmadi
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <tr key={employee.id} className="border-b hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm font-medium">{employee.full_name}</td>
                        <td className="px-4 py-3 text-sm">{employee.email}</td>
                        <td className="px-4 py-3 text-sm">{employee.role_display}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {employee.professionality || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              employee.is_active
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {employee.is_active ? "Faol" : "Nofaol"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(employee)}>
                                <Edit2 className="mr-2 h-4 w-4" />
                                Tahrirlash
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(employee)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                O'chirish
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <EmployeeFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingEmployee={editingEmployee}
        formData={formData}
        error={formError}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />

      <DeleteDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        itemName={employeeToDelete?.full_name || null}
        title="Xodimni o'chirish"
        onConfirm={handleDeleteConfirm}
        isLoading={isSubmitting}
      />
    </div>
  )
}
