import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface DeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemName?: string | null
  title?: string
  description?: string
  onConfirm: () => void
  isLoading?: boolean
}

export function DeleteDialog({
  open,
  onOpenChange,
  itemName,
  title = "O'chirish",
  description,
  onConfirm,
  isLoading = false,
}: DeleteDialogProps) {
  const finalDescription = description || (
    itemName ? (
      <>
        Rostdan ham <strong>{itemName}</strong> ni
        o'chirib tashlamoqchimisiz? Bu amalni qaytarib bo'lmaydi.
      </>
    ) : (
      "Rostdan ham o'chirib tashlamoqchimisiz? Bu amalni qaytarib bo'lmaydi."
    )
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {finalDescription}
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
