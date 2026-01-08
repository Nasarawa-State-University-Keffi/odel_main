import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { facultyService } from "../../services/facultyService";
import { Faculty, UpdateFacultyRequest } from "../../types/faculty";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/features/admin/components/admission/components/ui/dialog";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import { Label } from "@/features/admin/components/admission/components/ui/label";
import { Input } from "@/features/admin/components/admission/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Edit3, AlertCircle } from "lucide-react";
import { Switch } from "@/features/admin/components/admission/components/ui/switch";

interface UpdateFacultyModalProps {
    isOpen: boolean;
    onClose: () => void;
    faculty: Faculty | null;
}

const UpdateFacultyModal = ({ isOpen, onClose, faculty }: UpdateFacultyModalProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState<UpdateFacultyRequest>({
        id: 0,
        name: "",
        code: "",
        science: false
    });

    useEffect(() => {
        if (faculty) {
            setFormData({
                id: faculty.id,
                name: faculty.name,
                code: faculty.code,
                science: faculty.science
            });
        }
    }, [faculty]);

    const mutation = useMutation({
        mutationFn: (data: UpdateFacultyRequest) => facultyService.updateFaculty(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["faculties"] });
            toast({
                title: "Success",
                description: "Faculty updated successfully",
            });
            onClose();
        },
        onError: (error: Error) => {
            toast({
                title: "Update Failed",
                description: error.message,
                variant: "destructive",
            });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.code) {
            toast({
                title: "Validation Error",
                description: "Name and Code are required",
                variant: "destructive"
            });
            return;
        }

        mutation.mutate(formData);
    };

    if (!faculty) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[550px] border-border/50 shadow-2xl bg-background/95 backdrop-blur-xl duration-200 rounded-3xl">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2 text-xl font-black tracking-tight">
                        <Edit3 className="h-5 w-5 text-primary" />
                        Update Faculty
                    </DialogTitle>
                    <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                        Modify academic faculty details for {faculty.name}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-6">
                    <div className="space-y-5 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name" className="text-xs font-bold uppercase tracking-wide text-muted-foreground ml-1">Faculty Name</Label>
                            <Input
                                id="edit-name"
                                placeholder="Faculty Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="h-11 bg-muted/50 border-border/50 focus:ring-primary/20 rounded-xl text-xs font-bold"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-code" className="text-xs font-bold uppercase tracking-wide text-muted-foreground ml-1">Faculty Code</Label>
                            <Input
                                id="edit-code"
                                placeholder="Faculty Code"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                className="h-11 bg-muted/50 border-border/50 focus:ring-primary/20 rounded-xl text-xs font-black uppercase"
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/40 transition-all hover:border-primary/20 group">
                            <div className="space-y-0.5">
                                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Science Based</Label>
                                <p className="text-[9px] text-muted-foreground/70 font-bold group-hover:text-primary transition-colors">Is this science faculty?</p>
                            </div>
                            <Switch
                                id="edit-science"
                                checked={formData.science}
                                onCheckedChange={(checked) => setFormData({ ...formData, science: checked })}
                            />
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-3">
                        <AlertCircle className="h-4 w-4 text-blue-600/70 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-black text-blue-900/80 uppercase tracking-tight">Data Integrity Note</p>
                            <p className="text-[9px] text-blue-700/70 font-bold leading-relaxed">
                                Updating the faculty code may affect related department mappings. Proceed with caution.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="pt-4 border-t border-border/50 flex gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="rounded-xl h-10 font-bold text-xs px-6 hover:bg-muted"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={mutation.isPending}
                            className="h-10 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-xs shadow-lg shadow-primary/10 transition-all active:scale-95"
                        >
                            {mutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Apply Changes"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default UpdateFacultyModal;
