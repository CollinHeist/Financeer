import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * A reusable delete confirmation dialog component
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onOpenChange - Function to call when the open state changes
 * @param {string} props.title - The dialog title
 * @param {string} props.itemName - The name of the item being deleted
 * @param {string} props.itemType - The type of item being deleted (e.g., "expense", "income")
 * @param {Function} props.onConfirm - Function to call when deletion is confirmed
 * @param {boolean} props.isDeleting - Whether the deletion is in progress
 * @returns {JSX.Element}
 */
export function DeleteConfirmation({
  open,
  onOpenChange,
  title = "Delete Item",
  itemName,
  itemType = "item",
  onConfirm,
  isDeleting = false,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            This action <u>cannot be undone</u>. This will permanently delete the{" "}
            <span className="font-semibold text-blue-500">{itemName}</span> {itemType}.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-start">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
