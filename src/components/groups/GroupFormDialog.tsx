import type { FormEvent } from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import type { Group, Employee } from "@/lib/api"
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
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"

const SPECIALITY_OPTIONS = [
  { value: "revit_architecture", label: "Revit Architecture" },
  { value: "revit_structure", label: "Revit Structure" },
  { value: "tekla_structure", label: "Tekla Structure" },
]

const DATES_OPTIONS = [
  { value: "mon_wed_fri", label: "Dushanba - Chorshanba - Juma" },
  { value: "tue_thu_sat", label: "Seshanba - Payshanba - Shanba" },
]

interface GroupFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingGroup: Group | null
  formData: {
    speciality_id: string
    dates: string
    time: string
    starting_date: string
    seats: number
    price: string
    total_lessons: number | null
    mentor: number | null
    is_active: boolean
  }
  error: string | null
  mentors: Employee[]
  onChange: (field: string, value: string | number | boolean | null) => void
  onSubmit: (e: FormEvent) => void
  isLoading?: boolean
}

export function GroupFormDialog({
  open,
  onOpenChange,
  editingGroup,
  formData,
  error,
  mentors,
  onChange,
  onSubmit,
  isLoading = false,
}: GroupFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>
            {editingGroup ? "Guruhni tahrirlash" : "Yangi guruh qo'shish"}
          </DialogTitle>
          <DialogDescription>
            {editingGroup
              ? "Guruh ma'lumotlarini yangilang"
              : "Yangi guruh ma'lumotlarini kiriting"}
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
              <Field>
                <FieldLabel htmlFor="speciality_id">Mutaxassislik *</FieldLabel>
                <Select
                  value={formData.speciality_id}
                  onValueChange={(value) => onChange("speciality_id", value)}
                  required
                  disabled={isLoading}
                >
                  <SelectTrigger id="speciality_id">
                    <SelectValue placeholder="Mutaxassislik tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="dates">Dars kunlari *</FieldLabel>
                <Select
                  value={formData.dates}
                  onValueChange={(value) => onChange("dates", value)}
                  required
                  disabled={isLoading}
                >
                  <SelectTrigger id="dates">
                    <SelectValue placeholder="Dars kunlarini tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATES_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="time">Dars vaqti *</FieldLabel>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => onChange("time", e.target.value)}
                  required
                  disabled={isLoading}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="starting_date">Boshlanish sanasi</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="starting_date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.starting_date && "text-muted-foreground"
                      )}
                      disabled={isLoading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.starting_date ? (
                        format(new Date(formData.starting_date), "PPP")
                      ) : (
                        <span>Sana tanlang</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.starting_date ? new Date(formData.starting_date) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          onChange("starting_date", format(date, "yyyy-MM-dd"))
                        } else {
                          onChange("starting_date", "")
                        }
                      }}
                      disabled={isLoading}
                      initialFocus
                      captionLayout="dropdown"
                      fromYear={new Date().getFullYear()}
                      toYear={new Date().getFullYear() + 10}
                    />
                  </PopoverContent>
                </Popover>
              </Field>

              <Field>
                <FieldLabel htmlFor="seats">Maksimal o'rinlar *</FieldLabel>
                <Input
                  id="seats"
                  type="number"
                  min="1"
                  value={formData.seats}
                  onChange={(e) => onChange("seats", parseInt(e.target.value) || 0)}
                  required
                  disabled={isLoading}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="price">Narx (so'm) *</FieldLabel>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => onChange("price", e.target.value)}
                  required
                  disabled={isLoading}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="total_lessons">Jami darslar soni</FieldLabel>
                <Input
                  id="total_lessons"
                  type="number"
                  min="1"
                  value={formData.total_lessons || ""}
                  onChange={(e) => onChange("total_lessons", e.target.value ? parseInt(e.target.value) : null)}
                  disabled={isLoading}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="mentor">Mentor</FieldLabel>
                <Select
                  value={formData.mentor?.toString()}
                  onValueChange={(value) => onChange("mentor", value ? parseInt(value) : null)}
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
              </Field>

              {editingGroup && (
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
              {isLoading ? "Saqlanmoqda..." : editingGroup ? "Saqlash" : "Qo'shish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
