import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { departmentService } from "@/features/admin/services/departmentService";
import { admissionService } from "@/features/admin/services/admissionService";
import { staffService } from "@/features/admin/services/staffService";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, GraduationCap, CheckCircle2 } from "lucide-react";
import { RunGraduationModalProps } from "@/features/admin/types/department";



const RunGraduationModal = ({ isOpen, onClose, departmentId }: RunGraduationModalProps) => {
    const { toast } = useToast();
    const [semester, setSemester] = useState<string>("");
    const [date, setDate] = useState<string>("");
    const [selectedProgramme, setSelectedProgramme] = useState<string>("");
    const [resultData, setResultData] = useState<any>(null);

    // Fetch Active Admission for Semester
    const { data: activeAdmission } = useQuery({
        queryKey: ["activeAdmission"],
        queryFn: admissionService.getActiveAdmission,
    });

    // Fetch All Programmes to filter by Department
    const { data: programmes } = useQuery({
        queryKey: ["programmes"],
        queryFn: staffService.getAllProgrammes,
    });

    const relevantProgrammes = programmes?.filter(p => p.department?.id === departmentId) || [];

    useEffect(() => {
        if (activeAdmission?.semester?.id) {
            setSemester(activeAdmission.semester.id.toString());
        }
    }, [activeAdmission]);

    // Reset state on close
    useEffect(() => {
        if (!isOpen) {
            setResultData(null);
            setSelectedProgramme("");
            setDate("");
        }
    }, [isOpen]);

    const graduationMutation = useMutation({
        mutationFn: async () => {
            if (!selectedProgramme || !semester || !date) return;
            return await departmentService.runGraduationService({
                programme: parseInt(selectedProgramme),
                semester: parseInt(semester),
                date
            });
        },
        onSuccess: (data) => {
            setResultData(data);
            toast({
                title: "Service Completed",
                description: "Graduation service executed successfully.",
            });
        },
        onError: (error: any) => {
            const status = error?.response?.status;
            if (status === 403) {
                toast({
                    variant: "destructive",
                    title: "Access Denied",
                    description: "You do not have permission. Only HODs can run this service.",
                });
            } else if (status === 404) {
                toast({
                    variant: "destructive",
                    title: "Not Found",
                    description: "Programme or Semester not found.",
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to run graduation service.",
                });
            }
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        graduationMutation.mutate();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        {resultData ? "Graduation Results" : "Run Graduation Service"}
                    </DialogTitle>
                    <DialogDescription>
                        {resultData
                            ? "Summary of the graduation process."
                            : "Process graduation for a specific programme and semester."}
                    </DialogDescription>
                </DialogHeader>

                {resultData ? (
                    <div className="py-4 space-y-4">
                        <div className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-lg border border-green-100">
                            <CheckCircle2 className="h-12 w-12 text-green-600 mb-2" />
                            <h3 className="text-lg font-bold text-green-800">Success</h3>
                            <p className="text-sm text-green-600">Graduation service completed</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded border text-center">
                                <p className="text-2xl font-bold text-slate-800">{resultData.graduatedCount}</p>
                                <p className="text-xs text-muted-foreground uppercase font-bold">Graduated</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded border text-center">
                                <p className="text-2xl font-bold text-slate-800">{resultData.failedCount}</p>
                                <p className="text-xs text-muted-foreground uppercase font-bold">Failed</p>
                            </div>
                        </div>
                        {resultData.details && (
                            <p className="text-sm text-muted-foreground mt-2 bg-slate-50 p-3 rounded border">
                                {resultData.details}
                            </p>
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="programme">Programme</Label>
                            <Select value={selectedProgramme} onValueChange={setSelectedProgramme} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Programme" />
                                </SelectTrigger>
                                <SelectContent>
                                    {relevantProgrammes.map(prog => (
                                        <SelectItem key={prog.id} value={prog.id.toString()}>
                                            {prog.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="semester">Semester ID</Label>
                            <Input
                                id="semester"
                                type="number"
                                placeholder="Loading..."
                                value={semester}
                                readOnly
                                disabled
                                className="bg-slate-100 cursor-not-allowed"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date">Graduation Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </div>
                    </form>
                )}

                <DialogFooter>
                    {resultData ? (
                        <Button onClick={onClose} className="w-full">
                            Close
                        </Button>
                    ) : (
                        <>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                onClick={handleSubmit}
                                disabled={graduationMutation.isPending || !departmentId || !selectedProgramme}
                            >
                                {graduationMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Run Service
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default RunGraduationModal;
