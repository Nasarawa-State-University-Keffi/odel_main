import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/features/admin/components/admission/components/ui/dialog";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import { departmentService } from "@/features/admin/services/departmentService";
import { Qualification, Department } from "@/features/admin/types/department";
import { useToast } from "@/hooks/use-toast";
import { Loader2, GraduationCap, CheckCircle2, Circle } from "lucide-react";
import { ScrollArea } from "@/features/admin/components/admission/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ManageQualificationsModalProps {
    isOpen: boolean;
    onClose: () => void;
    department: Department | null;
}

const ManageQualificationsModal = ({ isOpen, onClose, department }: ManageQualificationsModalProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Fetch all available qualifications
    const { data: qdata, isLoading: isLoadingQ } = useQuery<Qualification[], Error>({
        queryKey: ["qualifications"],
        queryFn: departmentService.getQualifications,
        enabled: isOpen,
    });

    // Fetch current allowed qualifications for this department
    const { data: currentAllowed, isLoading: isLoadingCurrent } = useQuery<Qualification[], Error>({
        queryKey: ["department-qualifications", department?.id],
        queryFn: () => departmentService.getAllowedQualificationsForDepartment(department!.id),
        enabled: isOpen && !!department?.id,
    });

    // Reset selection when modal opens or current allowed qualifications change
    useEffect(() => {
        if (isOpen && currentAllowed) {
            setSelectedIds(currentAllowed.map(q => q.id));
        } else if (isOpen && !isLoadingCurrent) {
            setSelectedIds([]);
        }
    }, [isOpen, currentAllowed, isLoadingCurrent]);

    const mutation = useMutation({
        mutationFn: (ids: number[]) =>
            departmentService.setAllowedQualifications({
                departmentId: department!.id,
                qualificationIds: ids
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["departments"] });
            toast({
                title: "Success",
                description: "Allowed qualifications updated successfully",
            });
            onClose();
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message || "Failed to update qualifications",
                variant: "destructive",
            });
        }
    });

    const toggleQualification = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    };

    const handleSave = () => {
        if (!department) return;
        mutation.mutate(selectedIds);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] flex flex-col h-[600px] p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <div className="flex items-center gap-2 mb-1">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        <DialogTitle className="text-xl font-bold">Allowed Qualifications</DialogTitle>
                    </div>
                    <DialogDescription className="text-xs">
                        Select qualifications required for admission into <span className="font-bold text-foreground">{department?.name}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    {(isLoadingQ || isLoadingCurrent) ? (
                        <div className="h-full flex flex-col items-center justify-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
                            <p className="text-sm font-medium text-muted-foreground">Loading qualifications...</p>
                        </div>
                    ) : (
                        <ScrollArea className="h-full px-6 py-4">
                            <div className="grid grid-cols-1 gap-2">
                                {qdata?.map((qual) => {
                                    const isSelected = selectedIds.includes(qual.id);
                                    return (
                                        <div
                                            key={qual.id}
                                            onClick={() => toggleQualification(qual.id)}
                                            className={cn(
                                                "flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer group",
                                                isSelected
                                                    ? "border-primary bg-primary/5 shadow-sm"
                                                    : "border-border/40 hover:border-border hover:bg-slate-50"
                                            )}
                                        >
                                            <div className="flex flex-col">
                                                <span className={cn(
                                                    "font-bold text-sm transition-colors",
                                                    isSelected ? "text-primary" : "text-foreground"
                                                )}>
                                                    {qual.name}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                                                    ID: {qual.id}
                                                </span>
                                            </div>
                                            {isSelected ? (
                                                <CheckCircle2 className="h-5 w-5 text-primary" />
                                            ) : (
                                                <Circle className="h-5 w-5 text-border group-hover:text-muted-foreground transition-colors" />
                                            )}
                                        </div>
                                    );
                                })}
                                {(!qdata || qdata.length === 0) && (
                                    <div className="text-center py-12">
                                        <p className="text-sm text-muted-foreground">No qualifications found.</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-slate-50">
                    <Button variant="outline" onClick={onClose} className="rounded-lg font-bold">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={mutation.isPending || !department}
                        className="rounded-lg font-bold min-w-[120px] shadow-lg shadow-primary/20"
                    >
                        {mutation.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ManageQualificationsModal;
