import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/features/admin/components/admission/components/ui/alert-dialog";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { gradeService } from "../../services/gradeService";
import { useToast } from "@/features/admin/components/admission/components/ui/use-toast";

interface DeleteGradeButtonProps {
    gradeId: number;
    gradeTitle: string;
    programmeTypeId: string;
}

const DeleteGradeButton = ({ gradeId, gradeTitle, programmeTypeId }: DeleteGradeButtonProps) => {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { mutate, isPending } = useMutation({
        mutationFn: () => gradeService.deleteGrade(gradeId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["grades", programmeTypeId] });
            toast({
                title: "Success",
                description: `Grade ${gradeTitle} disabled successfully`,
                className: "bg-green-500 text-white border-none",
            });
            setOpen(false);
        },
        onError: (err: any) => {
            toast({
                title: "Error",
                description: err.message,
                variant: "destructive",
            });
            setOpen(false); // Close on error too, or keep open? Usually close or show error in dialog. Toast is fine.
        }
    });

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-0 shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500" />
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        Disable Grade?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="font-medium text-slate-500 text-xs">
                        Are you sure you want to disable Grade <strong>{gradeTitle}</strong>? This action will prevent it from being used in new records.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4">
                    <AlertDialogCancel className="font-bold text-muted-foreground">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            mutate();
                        }}
                        disabled={isPending}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-900/20"
                    >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Disable Grade"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default DeleteGradeButton;
