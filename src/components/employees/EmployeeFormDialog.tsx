import type { FormEvent } from "react"
import type { Employee} from "@/lib/api"
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
import { Switch } from "@/components/ui/switch"

const ROLE_OPTIONS = [
  { value: "dasturchi", label: "Dasturchi" },
  { value: "direktor", label: "Direktor" },
  { value: "administrator", label: "Administrator" },
  { value: "sotuv_agenti", label: "Sotuv agenti" },
  { value: "mentor", label: "Mentor" },
  { value: "assistent", label: "Assistent" },
]

interface EmployeeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingEmployee: Employee | null
  formData: {
    email: string
    first_name: string
    last_name: string
    password: string
    password_confirm: string
    full_name: string
    role: string
    professionality: string
    avatar: File | null
    is_active: boolean
  }
  error: string | null
  onChange: (field: string, value: string | File | boolean | null) => void
  onSubmit: (e: FormEvent) => void
  isLoading?: boolean
}

export function EmployeeFormDialog({
  open,
  onOpenChange,
  editingEmployee,
  formData,
  error,
  onChange,
  onSubmit,
  isLoading = false,
}: EmployeeFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>
            {editingEmployee ? "Xodimni tahrirlash" : "Yangi xodim qo'shish"}
          </DialogTitle>
          <DialogDescription>
            {editingEmployee
              ? "Xodim ma'lumotlarini yangilang"
              : "Yangi xodim ma'lumotlarini kiriting"}
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
              {!editingEmployee && (
                <>
                  <Field>
                    <FieldLabel htmlFor="email">Email *</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => onChange("email", e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="first_name">Ism *</FieldLabel>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => onChange("first_name", e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="last_name">Familiya *</FieldLabel>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => onChange("last_name", e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="password">Parol *</FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => onChange("password", e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="password_confirm">Parolni tasdiqlash *</FieldLabel>
                    <Input
                      id="password_confirm"
                      type="password"
                      value={formData.password_confirm}
                      onChange={(e) => onChange("password_confirm", e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </Field>
                </>
              )}

              {editingEmployee && (
                <Field>
                  <FieldLabel htmlFor="full_name">To'liq ism *</FieldLabel>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => onChange("full_name", e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </Field>
              )}

              <Field>
                <FieldLabel htmlFor="role">Role *</FieldLabel>
                <Select
                  value={formData.role}
                  onValueChange={(value) => onChange("role", value)}
                  required
                  disabled={isLoading}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Role tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="professionality">Mutaxassislik</FieldLabel>
                <Input
                  id="professionality"
                  value={formData.professionality}
                  onChange={(e) => onChange("professionality", e.target.value)}
                  disabled={isLoading}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="avatar">Avatar</FieldLabel>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    onChange("avatar", e.target.files?.[0] || null)
                  }
                  disabled={isLoading}
                />
              </Field>

              <Field orientation="horizontal">
                <FieldLabel htmlFor="is_active">Holat</FieldLabel>
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => onChange("is_active", checked)}
                    disabled={isLoading}
                  />
                  <span className="text-sm text-muted-foreground">
                    {formData.is_active ? "Faol" : "Nofaol"}
                  </span>
                </div>
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
              {isLoading ? "Saqlanmoqda..." : editingEmployee ? "Saqlash" : "Qo'shish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
