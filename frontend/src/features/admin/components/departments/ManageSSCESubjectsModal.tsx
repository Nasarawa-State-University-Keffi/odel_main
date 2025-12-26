import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { departmentService } from "@/features/admin/services/departmentService";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BookOpen, PlusCircle, Trash2, AlertCircle, Check, GraduationCap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Subject, Grade } from "@/features/admin/types/department";
import { FloatingMultiSelect, Option } from "@/components/ui/floating-multi-select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ManageSSCESubjectsModalProps {
    isOpen: boolean;
    onClose: () => void;
    departmentId: number | null;
}

const ManageSSCESubjectsModal = ({ isOpen, onClose, departmentId }: ManageSSCESubjectsModalProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

    // Fetch All Available Subjects
    const { data: subjects, isLoading: isLoadingSubjects } = useQuery({
        queryKey: ["subjects"],
        queryFn: departmentService.getAllSubjects,
        enabled: isOpen,
    });

    // Fetch Current Requirements
    const { data: requirements, isLoading: isLoadingReqs, isError: isReqError, error: reqError } = useQuery({
        queryKey: ["departmentRequirements", departmentId],
        queryFn: async () => {
            if (!departmentId) return [];
            return await departmentService.getDepartmentRequirements(departmentId);
        },
        enabled: isOpen && !!departmentId,
        retry: 1,
    });

    // Fetch All Grades
    const { data: allGrades } = useQuery({
        queryKey: ["grades"],
        queryFn: departmentService.getAllGrades,
        enabled: isOpen,
    });

    // Handle Fetch Errors
    useEffect(() => {
        if (isReqError && reqError) {
            const status = (reqError as any)?.response?.status;
            if (status === 404) {
                toast({
                    variant: "destructive",
                    title: "Not Found",
                    description: "Department not found."
                });
            }
        }
    }, [isReqError, reqError]);

    const subjectOptions: Option[] = useMemo(() => {
        if (!subjects) return [];
        return subjects.map((s: Subject) => ({
            label: `${s.name}${s.code ? ` (${s.code})` : ''}`,
            value: s.id.toString(),
        }));
    }, [subjects]);

    const addBulkSubjectsMutation = useMutation({
        mutationFn: async () => {
            if (!departmentId || selectedSubjectIds.length === 0) return;
            const numericIds = selectedSubjectIds.map(id => parseInt(id));
            return await departmentService.addBulkSSCESubjects(departmentId, numericIds);
        },
        onSuccess: (data) => {
            toast({
                title: "Subjects Added",
                description: `Successfully added ${data.length} subject(s) to requirements.`,
            });
            setSelectedSubjectIds([]);
            queryClient.invalidateQueries({ queryKey: ["departmentRequirements", departmentId] });
        },
        onError: (error: any) => {
            const status = error?.response?.status;
            let msg = "Failed to add subject requirements.";
            if (status === 404) msg = "Department or Subject(s) not found.";
            else if (status === 422) msg = error?.response?.data?.message || "Invalid request. Ensure subjects are not already added.";

            toast({
                variant: "destructive",
                title: "Error",
                description: msg
            });
        }
    });

    const toggleCompulsoryMutation = useMutation({
        mutationFn: async (dsubjectId: number) => {
            return await departmentService.toggleCompulsorySubject(dsubjectId);
        },
        onSuccess: () => {
            // Optimistic update via invalidation
            queryClient.invalidateQueries({ queryKey: ["departmentRequirements", departmentId] });
            toast({
                title: "Updated",
                description: "Subject compulsory status updated.",
            });
        },
        onError: (error: any) => {
            const status = error?.response?.status;
            let msg = "Failed to update status.";
            if (status === 404) msg = "Requirement not found.";

            toast({
                variant: "destructive",
                title: "Error",
                description: msg
            });
        }
    });

    const updateGradesMutation = useMutation({
        mutationFn: async (data: { dsubjectId: number, gradeIds: number[] }) => {
            return await departmentService.updateSubjectGrades(data.dsubjectId, data.gradeIds);
        },
        onSuccess: () => {
            toast({
                title: "Grades Updated",
                description: "Subject acceptable grades updated.",
            });
            queryClient.invalidateQueries({ queryKey: ["departmentRequirements", departmentId] });
        },
        onError: (error: any) => {
            const status = error?.response?.status;
            let msg = "Failed to update grades.";
            if (status === 404) {
                msg = error?.response?.data?.message || "Item or grades not found.";
            }

            toast({
                variant: "destructive",
                title: "Error",
                description: msg
            });
        }
    });

    const removeSubjectMutation = useMutation({
        mutationFn: async (subjectId: number) => {
            if (!departmentId) return;
            return await departmentService.removeSSCESubject(departmentId, subjectId);
        },
        onSuccess: () => {
            toast({
                title: "Subject Removed",
                description: "Requirement removed successfully."
            });
            queryClient.invalidateQueries({ queryKey: ["departmentRequirements", departmentId] });
        },
        onError: (error: any) => {
            const status = error?.response?.status;
            let msg = "Failed to remove subject.";
            if (status === 404) msg = "Department, Subject or Requirement not found.";

            toast({
                variant: "destructive",
                title: "Error",
                description: msg
            });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addBulkSubjectsMutation.mutate();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] flex flex-col h-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Manage SSCE Requirements
                    </DialogTitle>
                    <DialogDescription>
                        Configure compulsory SSCE subjects and acceptable grades.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="current" className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="current">Current Requirements</TabsTrigger>
                        <TabsTrigger value="add">Add New</TabsTrigger>
                    </TabsList>

                    <TabsContent value="current" className="flex-1 flex flex-col overflow-hidden mt-4 space-y-4">
                        {isLoadingReqs ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : requirements && requirements.length > 0 ? (
                            <ScrollArea className="flex-1 w-full rounded-md border p-2 bg-slate-50/50">
                                <div className="space-y-2">
                                    {requirements.map((req: any) => (
                                        <SubjectRow
                                            key={req.id}
                                            req={req}
                                            allGrades={allGrades}
                                            onToggleCompulsory={(id) => toggleCompulsoryMutation.mutate(id)}
                                            onRemove={(id) => removeSubjectMutation.mutate(id)}
                                            onUpdateGrades={(id, grades) => updateGradesMutation.mutate({ dsubjectId: id, gradeIds: grades })}
                                            isPendingToggle={toggleCompulsoryMutation.isPending}
                                            isPendingRemove={removeSubjectMutation.isPending}
                                        />
                                    ))}
                                </div>
                            </ScrollArea>
                        ) : (
                            <div className="flex flex-col items-center justify-center flex-1 border border-dashed rounded-md bg-slate-50/30 text-muted-foreground">
                                <AlertCircle className="h-8 w-8 mb-2 opacity-20" />
                                <span className="text-xs">No subjects currently required.</span>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="add" className="flex-1 flex flex-col mt-4 space-y-4">
                        <div className="space-y-4 p-1">
                            <div className="bg-blue-50/50 p-3 rounded-md border border-blue-100/50 text-sm text-blue-800">
                                <p className="flex items-start gap-2">
                                    <BookOpen className="h-4 w-4 mt-0.5 shrink-0" />
                                    <span>Select subjects from the list below to add them to this department's requirements. You can add multiple subjects at once.</span>
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-foreground/80">Select Subjects</Label>
                                <FloatingMultiSelect
                                    label="Search and select subjects..."
                                    options={subjectOptions}
                                    selected={selectedSubjectIds}
                                    onChange={setSelectedSubjectIds}
                                    disabled={isLoadingSubjects}
                                />
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={selectedSubjectIds.length === 0 || addBulkSubjectsMutation.isPending}
                                className="w-full"
                            >
                                {addBulkSubjectsMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                )}
                                Add {selectedSubjectIds.length > 0 ? `${selectedSubjectIds.length} ` : ''}Subject{selectedSubjectIds.length !== 1 ? 's' : ''}
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="mt-2">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const SubjectRow = ({
    req,
    allGrades,
    onToggleCompulsory,
    onRemove,
    onUpdateGrades,
    isPendingToggle,
    isPendingRemove
}: {
    req: any,
    allGrades: Grade[] | undefined,
    onToggleCompulsory: (id: number) => void,
    onRemove: (id: number) => void,
    onUpdateGrades: (id: number, grades: number[]) => void,
    isPendingToggle: boolean,
    isPendingRemove: boolean
}) => {
    const subject = req.subject || req;
    const [openGrades, setOpenGrades] = useState(false);

    // req.grades contains array of { id, grade, description? }. We need IDs for selection logic.
    const currentGradeIds = useMemo(() => {
        if (!req.grades || !Array.isArray(req.grades)) return [];
        return req.grades.map((g: any) => g.id);
    }, [req.grades]);

    const [selectedGrades, setSelectedGrades] = useState<number[]>([]);

    useEffect(() => {
        setSelectedGrades(currentGradeIds);
    }, [currentGradeIds]);

    const handleGradeToggle = (gradeId: number) => {
        setSelectedGrades(prev => {
            if (prev.includes(gradeId)) {
                return prev.filter(id => id !== gradeId);
            } else {
                return [...prev, gradeId];
            }
        });
    };

    const handleSaveGrades = () => {
        onUpdateGrades(req.id, selectedGrades);
        setOpenGrades(false);
    };

    return (
        <div className="flex items-center justify-between p-2 bg-white border rounded-md shadow-sm transition-colors hover:bg-slate-50">
            <div className="flex flex-col gap-1 w-[40%]">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate" title={subject.name}>{subject.name}</span>
                    {subject.code && <Badge variant="secondary" className="text-[10px] h-5">{subject.code}</Badge>}
                </div>
                <div className="flex flex-wrap gap-1">
                    {req.grades && req.grades.length > 0 ? (
                        req.grades.map((g: any) => {
                            const fullGrade = allGrades?.find(ag => ag.id === g.id);
                            return fullGrade || g;
                        }).slice(0, 3).map((g: any) => (
                            <Badge key={g.id} variant="outline" className="text-[10px] px-1 h-5 text-muted-foreground bg-slate-50">
                                {g.title || g.grade}
                            </Badge>
                        ))
                    ) : <span className="text-[10px] text-muted-foreground italic">Any Grade</span>}
                    {req.grades && req.grades.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{req.grades.length - 3}</span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                {/* Grade Selection Popover */}
                <Popover open={openGrades} onOpenChange={setOpenGrades}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-primary">
                            <GraduationCap className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="end">
                        <Command>
                            <CommandInput placeholder="Search grades..." className="h-9" />
                            <CommandList>
                                <CommandEmpty>No grade found.</CommandEmpty>
                                <CommandGroup className="max-h-[200px] overflow-y-auto">
                                    {allGrades?.map((grade) => (
                                        <CommandItem
                                            key={grade.id}
                                            value={grade.title || grade.grade}
                                            onSelect={() => handleGradeToggle(grade.id)}
                                        >
                                            <div className="flex items-center gap-2 flex-1">
                                                <div className={cn(
                                                    "h-4 w-4 border border-primary/50 rounded-sm flex items-center justify-center transition-all",
                                                    selectedGrades.includes(grade.id) ? "bg-primary text-primary-foreground border-primary" : "opacity-50"
                                                )}>
                                                    {selectedGrades.includes(grade.id) && <Check className="h-3 w-3" />}
                                                </div>
                                                <span className="font-medium">{grade.title || grade.grade}</span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                            <div className="p-2 border-t bg-slate-50">
                                <Button size="sm" className="w-full text-xs h-7" onClick={handleSaveGrades}>
                                    Save Grades
                                </Button>
                            </div>
                        </Command>
                    </PopoverContent>
                </Popover>

                <Separator orientation="vertical" className="h-6" />

                <div className="flex items-center gap-2" title="Toggle Compulsory">
                    <Switch
                        id={`compulsory-${req.id}`}
                        checked={req.compulsory}
                        onCheckedChange={() => onToggleCompulsory(req.id)}
                        disabled={isPendingToggle}
                        className="h-4 w-8"
                    />
                    <Label htmlFor={`compulsory-${req.id}`} className="text-[10px] text-muted-foreground cursor-pointer">Req</Label>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onRemove(subject.id)}
                    disabled={isPendingRemove}
                    title="Remove Subject"
                >
                    {isPendingRemove ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
            </div>
        </div>
    );
};

export default ManageSSCESubjectsModal;
