import {Button} from '@/components/ui/Button';
import {Modal} from '@/components/ui/Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  isPending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  isPending = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} className="max-w-lg">
      <div className="space-y-6">
        <p className="text-sm text-gray-300">{description}</p>
        <div className="flex justify-end gap-3">
          <Button intent="ghost" onClick={onCancel} disabled={isPending}>
            {cancelLabel}
          </Button>
          <Button intent="destructive" onClick={onConfirm} isLoading={isPending}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
