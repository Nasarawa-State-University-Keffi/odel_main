import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SuspendStudentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (reason: string) => Promise<void>;
    studentName: string;
}

export const SuspendStudentModal = ({
    open,
    onOpenChange,
    onConfirm,
    studentName,
}: SuspendStudentModalProps) => {
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) return;

        setIsSubmitting(true);
        try {
            await onConfirm(reason);
            onOpenChange(false);
            setReason("");
        } catch (error) {
            // this will throw a new error if parent error doesnt show
            throw new Error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-destructive font-black">Suspend Student</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to suspend <span className="font-bold text-foreground">{studentName}</span>?
                        This action will restrict their access to the portal.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="reason" className="text-xs font-bold uppercase text-muted-foreground">
                            Reason for Suspension <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="reason"
                            placeholder="Please provide a valid reason for this suspension..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="min-h-[100px] resize-none focus-visible:ring-destructive"
                            required
                        />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={!reason.trim() || isSubmitting}
                        >
                            {isSubmitting ? "Suspending..." : "Confirm Suspension"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
