import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // onConfirm?: () => void;   // optional
}

export default function ModalPopupYesOrNo({ open, onOpenChange }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      
      <Card className="relative z-50 w-[320px] p-6 flex flex-col gap-6">
        <h1 className="text-xl font-bold text-center">
          Are you sure on deleting BANNER-1?
        </h1>

        <div className="flex justify-center gap-8">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            No
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              // TODO: actually delete here
              onOpenChange(false);
            }}
          >
            Yes
          </Button>
        </div>
      </Card>
    </div>
  );
}