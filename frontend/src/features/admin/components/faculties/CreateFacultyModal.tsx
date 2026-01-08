import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { facultyService } from "../../services/facultyService";
import { CreateFacultyRequest } from "../../types/faculty";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/features/admin/components/admission/components/ui/dialog";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import { Label } from "@/features/admin/components/admission/components/ui/label";
import { Input } from "@/features/admin/components/admission/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, AlertCircle, Info } from "lucide-react";
import { Switch } from "@/features/admin/components/admission/components/ui/switch";

interface CreateFacultyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CreateFacultyModal = ({ isOpen, onClose }: CreateFacultyModalProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState<CreateFacultyRequest>({
        name: "",
        code: "",
        science: false,
        numberOfQuestions: 50
    });

    const mutation = useMutation({
        mutationFn: (data: CreateFacultyRequest) => facultyService.createFaculty(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["faculties"] });
            toast({
                title: "Success",
                description: "Faculty created successfully",
            });
            onClose();
            setFormData({ name: "", code: "", science: false, numberOfQuestions: 50 });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[550px] border-border/50 shadow-2xl bg-background/95 backdrop-blur-xl duration-200 rounded-3xl">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2 text-xl font-black tracking-tight">
                        <Building2 className="h-5 w-5 text-primary" />
                        Create Faculty
                    </DialogTitle>
                    <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                        Establish a new academic structure in the system
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-6">
                    <div className="space-y-5 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wide text-muted-foreground ml-1">Faculty Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g., Faculty of Natural Sciences"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="h-11 bg-muted/50 border-border/50 focus:ring-primary/20 rounded-xl text-xs font-bold"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="code" className="text-xs font-bold uppercase tracking-wide text-muted-foreground ml-1">Faculty Code</Label>
                            <Input
                                id="code"
                                placeholder="e.g., FNS"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                className="h-11 bg-muted/50 border-border/50 focus:ring-primary/20 rounded-xl text-xs font-black uppercase"
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/40 transition-all hover:border-primary/20 group">
                                <div className="space-y-0.5">
                                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Science Based</Label>
                                    <p className="text-[9px] text-muted-foreground/70 font-bold group-hover:text-primary transition-colors">Is this science faculty?</p>
                                </div>
                                <Switch
                                    checked={formData.science}
                                    onCheckedChange={(checked) => setFormData({ ...formData, science: checked })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="questions" className="text-xs font-bold uppercase tracking-wide text-muted-foreground ml-1">Default Questions</Label>
                                <Input
                                    id="questions"
                                    type="number"
                                    value={formData.numberOfQuestions}
                                    onChange={(e) => setFormData({ ...formData, numberOfQuestions: parseInt(e.target.value) || 0 })}
                                    className="h-11 bg-muted/50 border-border/50 focus:ring-primary/20 rounded-xl text-xs font-black"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex gap-3">
                        <Info className="h-4 w-4 text-amber-600/70 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-amber-700/80 font-bold leading-relaxed">
                            A newly created faculty will start with no departments. Use the Department Management module to assign them.
                        </p>
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
                                    Establishing...
                                </>
                            ) : (
                                "Create Faculty"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateFacultyModal;
