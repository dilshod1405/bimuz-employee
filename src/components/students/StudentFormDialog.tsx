import type { FormEvent } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import type { Student, Group } from "@/lib/api"
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
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const SOURCE_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "telegram", label: "Telegram" },
]

interface StudentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingStudent: Student | null
  formData: {
    email: string
    password: string
    password_confirm: string
    full_name: string
    phone: string
    passport_serial_number: string
    birth_date: string
    source: string
    address: string
    inn: string
    pinfl: string
    group: number | null
    certificate: File | null
    is_active: boolean
  }
  error: string | null
  groups?: Group[]
  onChange: (field: string, value: string | File | number | boolean | null) => void
  onSubmit: (e: FormEvent) => void
  isLoading?: boolean
}

export function StudentFormDialog({
  open,
  onOpenChange,
  editingStudent,
  formData,
  error,
  groups = [],
  onChange,
  onSubmit,
  isLoading = false,
}: StudentFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>
            {editingStudent ? "Talabani tahrirlash" : "Yangi talaba qo'shish"}
          </DialogTitle>
          <DialogDescription>
            {editingStudent
              ? "Talaba ma'lumotlarini yangilang"
              : "Yangi talaba ma'lumotlarini kiriting"}
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
              {!editingStudent && (
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

              <Field>
                <FieldLabel htmlFor="phone">Telefon raqami *</FieldLabel>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => onChange("phone", e.target.value)}
                  required
                  disabled={isLoading}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="passport_serial_number">Passport seriya raqami *</FieldLabel>
                <Input
                  id="passport_serial_number"
                  value={formData.passport_serial_number}
                  onChange={(e) => onChange("passport_serial_number", e.target.value)}
                  required
                  disabled={isLoading}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="birth_date">Tug'ilgan sana *</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="birth_date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.birth_date && "text-muted-foreground"
                      )}
                      disabled={isLoading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.birth_date ? (
                        format(new Date(formData.birth_date), "PPP")
                      ) : (
                        <span>Sana tanlang</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.birth_date ? new Date(formData.birth_date) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          onChange("birth_date", format(date, "yyyy-MM-dd"))
                        }
                      }}
                      disabled={isLoading}
                      initialFocus
                      captionLayout="dropdown"
                      fromYear={1900}
                      toYear={new Date().getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
              </Field>

              <Field>
                <FieldLabel htmlFor="source">Manba *</FieldLabel>
                <Select
                  value={formData.source}
                  onValueChange={(value) => onChange("source", value)}
                  required
                  disabled={isLoading}
                >
                  <SelectTrigger id="source">
                    <SelectValue placeholder="Manba tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="address">Manzil *</FieldLabel>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => onChange("address", e.target.value)}
                  required
                  disabled={isLoading}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="inn">INN *</FieldLabel>
                <Input
                  id="inn"
                  value={formData.inn}
                  onChange={(e) => onChange("inn", e.target.value)}
                  required
                  disabled={isLoading}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="pinfl">PINFL *</FieldLabel>
                <Input
                  id="pinfl"
                  value={formData.pinfl}
                  onChange={(e) => onChange("pinfl", e.target.value)}
                  required
                  disabled={isLoading}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="group">Guruh (ixtiyoriy)</FieldLabel>
                <Select
                  value={formData.group?.toString() || undefined}
                  onValueChange={(value) => onChange("group", value ? parseInt(value) : null)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="group">
                    <SelectValue placeholder="Guruh tanlang (ixtiyoriy)" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.speciality_display} - {group.dates_display} ({group.time})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="certificate">Sertifikat</FieldLabel>
                <Input
                  id="certificate"
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(e) =>
                    onChange("certificate", e.target.files?.[0] || null)
                  }
                  disabled={isLoading}
                />
              </Field>

              {editingStudent && (
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
              )}
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
              {isLoading ? "Saqlanmoqda..." : editingStudent ? "Saqlash" : "Qo'shish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
