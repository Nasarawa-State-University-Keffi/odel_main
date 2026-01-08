import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/features/admin/components/admission/components/ui/dialog";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import { Input } from "@/features/admin/components/admission/components/ui/input";
import { Label } from "@/features/admin/components/admission/components/ui/label";
import { Loader2, AlertCircle, Edit } from "lucide-react";
import { gradeService } from "../../services/gradeService";
import { useToast } from "@/features/admin/components/admission/components/ui/use-toast";
import { Grade } from "../../types/grade";

interface UpdateGradeModalProps {
    grade: Grade;
    programmeTypeId: string;
}

const UpdateGradeModal = ({ grade, programmeTypeId }: UpdateGradeModalProps) => {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState(grade.title);
    const [gradeLimit, setGradeLimit] = useState(grade.gradeLimit.toString());
    const [creditValue, setCreditValue] = useState(grade.creditValue.toString());
    const [gradeOrder, setGradeOrder] = useState(grade.gradeOrder.toString());

    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Reset form when modal opens or grade changes
    useEffect(() => {
        if (open) {
            setTitle(grade.title);
            setGradeLimit(grade.gradeLimit.toString());
            setCreditValue(grade.creditValue.toString());
            setGradeOrder(grade.gradeOrder.toString());
        }
    }, [open, grade]);

    const { mutate, isPending, error } = useMutation({
        mutationFn: gradeService.updateGrade,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["grades", programmeTypeId] });
            toast({
                title: "Success",
                description: "Grade updated successfully",
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
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        mutate({
            id: grade.id,
            data: {
                title,
                gradeLimit: Number(gradeLimit),
                creditValue: Number(creditValue),
                gradeOrder: Number(gradeOrder),
                programmeTypeId: Number(programmeTypeId),
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10">
                    <Edit className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] overflow-hidden border-0 shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-xl font-black text-[#0F3F2A] tracking-tight">Update Grade</DialogTitle>
                    <DialogDescription className="font-medium text-slate-500 text-xs">
                        Modify grade scale configuration.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="mb-6 bg-red-50 p-3 rounded-lg border border-red-100 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-none" />
                        <p className="text-xs font-bold text-red-600">{(error as any).message}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Grade Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value.toUpperCase())}
                            placeholder="e.g. A, B, C"
                            className="bg-slate-50 border-slate-200 focus:bg-white focus:border-primary/50 font-bold"
                            maxLength={2}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="limit" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Grade Limit</Label>
                            <Input
                                id="limit"
                                type="number"
                                step="0.1"
                                value={gradeLimit}
                                onChange={(e) => setGradeLimit(e.target.value)}
                                placeholder="e.g. 70.0"
                                className="bg-slate-50 border-slate-200 focus:bg-white focus:border-primary/50 font-bold"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="order" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Order</Label>
                            <Input
                                id="order"
                                type="number"
                                value={gradeOrder}
                                onChange={(e) => setGradeOrder(e.target.value)}
                                placeholder="e.g. 1"
                                className="bg-slate-50 border-slate-200 focus:bg-white focus:border-primary/50 font-bold"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="credit" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Credit Value</Label>
                        <Input
                            id="credit"
                            type="number"
                            value={creditValue}
                            onChange={(e) => setCreditValue(e.target.value)}
                            placeholder="e.g. 5"
                            className="bg-slate-50 border-slate-200 focus:bg-white focus:border-primary/50 font-bold"
                            required
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="font-bold text-muted-foreground">Cancel</Button>
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="Lh-11 px-6 rounded-xl font-black tracking-tight text-white shadow-lg shadow-emerald-900/10 transition-all active:scale-95 group"
                        >
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default UpdateGradeModal;
