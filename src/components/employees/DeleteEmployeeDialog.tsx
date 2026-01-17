import type { Employee } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface DeleteEmployeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
  onConfirm: () => void
  isLoading?: boolean
}

export function DeleteEmployeeDialog({
  open,
  onOpenChange,
  employee,
  onConfirm,
  isLoading = false,
}: DeleteEmployeeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Xodimni o'chirish</DialogTitle>
          <DialogDescription>
            {employee && (
              <>
                Rostdan ham <strong>{employee.full_name}</strong> ni
                o'chirib tashlamoqchimisiz? Bu amalni qaytarib bo'lmaydi.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="px-6 pb-6 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Bekor qilish
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "O'chirilmoqda..." : "O'chirish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
