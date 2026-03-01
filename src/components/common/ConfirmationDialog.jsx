import ExclamationTriangleIcon from "@heroicons/react/24/outline/ExclamationTriangleIcon";
import useScrollLock from "@/hooks/useScrollLock";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import LoadingButton from "@/components/common/LoadingButton";
import { Progress } from "@/components/ui/progress";


/**
 * Reusable confirmation dialog using shadcn Dialog primitives.
 * @param {boolean} isOpen - Controls dialog visibility.
 * @param {Function} onClose - Called when dialog is closed.
 * @param {Function} onConfirm - Called when the confirm button is clicked.
 * @param {string} dialogTitle - Title text for the dialog header.
 * @param {boolean} isDeleting - Shows loading progress bar while true.
 * @param {string} description - Body description text.
 * @param {string} buttonText - Label for the confirm button.
 * @param {string} [loadingText] - Label shown while isDeleting is true.
 */
export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  dialogTitle,
  isDeleting,
  description,
  buttonText,
  loadingText,
}) {
  const loaderText = loadingText || "Processing...";
  useScrollLock(isOpen);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isDeleting) onClose(); }}>
      <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-sm border border-white/20 rounded-2xl p-0 overflow-hidden">
        <div className="px-4 pb-4 pt-5 sm:p-6">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100/80 backdrop-blur-sm sm:mx-0 sm:h-10 sm:w-10">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
            </div>
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <DialogHeader>
                <DialogTitle className="font-artistic text-2xl font-bold tracking-wide text-gray-900">
                  {dialogTitle}
                </DialogTitle>
                <DialogDescription className="mt-3 text-base font-sans text-gray-600">
                  {description}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          {isDeleting && (
            <div className="mt-4">
              <Progress value={100} className="[&>div]:bg-red-500 [&>div]:transition-none" />
              <p className="text-sm text-center font-sans text-gray-500 mt-1">
                {loaderText}
              </p>
            </div>
          )}

          <div className="mt-6 sm:flex sm:flex-row-reverse gap-3">
            <LoadingButton
              variant="destructive"
              size="sm"
              loading={isDeleting}
              loadingLabel={loaderText}
              loaderColor="red-600"
              onClick={onConfirm}
              className="w-full sm:w-auto"
            >
              {buttonText}
            </LoadingButton>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isDeleting}
              className="mt-3 w-full sm:mt-0 sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
