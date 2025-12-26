import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { staffService } from "@/features/admin/services/staffService";
import { departmentService } from "@/features/admin/services/departmentService";
import { courseService } from "@/features/admin/services/courseService";
import { CreateCourseRequest, ProgrammeCourse } from "@/features/admin/types/course";
import { Loader2, Plus, Edit } from "lucide-react";

interface CourseFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    courseToEdit?: ProgrammeCourse;
}

const CourseFormModal = ({ open, onOpenChange, courseToEdit }: CourseFormModalProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const isEditMode = !!courseToEdit;

    const [form, setForm] = useState<Partial<CreateCourseRequest>>({
        courseCode: "",
        title: "",
        creditUnit: 0,
        departmentId: undefined,
        levelId: undefined,
        programme: undefined, // Optional
        programmeTypeId: undefined,
        compulsory: false,
        courseSpan: undefined,
    });

    // Fetch Dependencies
    const { data: departments = [] } = useQuery({
        queryKey: ["departments"],
        queryFn: departmentService.getAllDepartments,
    });

    const { data: levels = [] } = useQuery({
        queryKey: ["levels"],
        queryFn: async () => [
            { id: 1, name: "100 Level" },
            { id: 2, name: "200 Level" },
            { id: 3, name: "300 Level" },
            { id: 4, name: "400 Level" },
            { id: 5, name: "500 Level" },
        ],
    });

    const { data: programmeTypes = [] } = useQuery({
        queryKey: ["programmeTypes"],
        queryFn: staffService.getAllProgrammeTypes
    });

    const { data: programmes = [] } = useQuery({
        queryKey: ["programmes"],
        queryFn: staffService.getAllProgrammes,
        enabled: form.courseSpan === 1104
    });

    // Course Span Options
    const courseSpans = [
        { id: 1101, label: "University Wide" },
        { id: 1102, label: "Faculty Wide" },
        { id: 1103, label: "Department Wide" },
        { id: 1104, label: "Programme Specific" },
    ];

    // Reset or populate form when modal opens
    useEffect(() => {
        if (open) {
            if (courseToEdit) {
                setForm({
                    courseCode: courseToEdit.courseCode,
                    title: courseToEdit.title,
                    creditUnit: courseToEdit.creditUnit,
                    departmentId: courseToEdit.department?.id,
                    levelId: courseToEdit.level?.id,
                    programme: courseToEdit.programme?.id,
                    programmeTypeId: courseToEdit.programmeType?.id,
                    compulsory: courseToEdit.compulsory,
                    courseSpan: courseToEdit.courseSpan,
                });
            } else {
                setForm({
                    courseCode: "",
                    title: "",
                    creditUnit: 0,
                    departmentId: undefined,
                    levelId: undefined,
                    programme: undefined,
                    programmeTypeId: undefined,
                    compulsory: false,
                    courseSpan: undefined,
                });
            }
        }
    }, [open, courseToEdit]);

    const handleApiErrors = (error: any) => {
        if (error.response) {
            const status = error.response.status;
            switch (status) {
                case 400:
                    toast({
                        variant: "destructive",
                        title: "Action Failed",
                        description: error.response.data?.message || "Invalid input provided. Please check your data.",
                    });
                    break;
                case 401:
                    toast({
                        variant: "destructive",
                        title: "Unauthorized",
                        description: "Your session has expired. Please log in again.",
                    });
                    break;
                case 403:
                    toast({
                        variant: "destructive",
                        title: "Permission Denied",
                        description: "You do not have the required permissions to perform this action.",
                    });
                    break;
                case 404:
                    toast({
                        variant: "destructive",
                        title: "Not Found",
                        description: "One of the selected resources (Department, Level, etc.) was not found.",
                    });
                    break;
                case 409:
                    toast({
                        variant: "destructive",
                        title: "Conflict",
                        description: "This course already exists in the system.",
                    });
                    break;
                case 500:
                    toast({
                        variant: "destructive",
                        title: "System Error",
                        description: "An internal server error occurred. Please try again later.",
                    });
                    break;
                default:
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: error.response.data?.message || `An unexpected error occurred (Status: ${status}).`,
                    });
            }
        } else if (error.request) {
            toast({
                variant: "destructive",
                title: "Network Error",
                description: "Unable to connect to the server. Please check your internet connection.",
            });
        } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: "An unexpected error occurred.",
            });
        }
    };

    const createCourseMutation = useMutation({
        mutationFn: courseService.createCourse,
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Course created successfully.",
            });
            onOpenChange(false);
            queryClient.invalidateQueries({ queryKey: ["courses"] });
            setForm({}); // Clear form
        },
        onError: handleApiErrors
    });

    const updateCourseMutation = useMutation({
        mutationFn: (data: CreateCourseRequest) => courseService.updateCourse(courseToEdit!.id, data),
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Course updated successfully.",
            });
            onOpenChange(false);
            queryClient.invalidateQueries({ queryKey: ["courses"] });
            setForm({}); // Clear form
        },
        onError: handleApiErrors
    });


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.courseCode || !form.title || !form.creditUnit || !form.departmentId || !form.levelId || !form.programmeTypeId || !form.courseSpan) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Please fill in all required fields.",
            });
            return;
        }

        if (isEditMode) {
            updateCourseMutation.mutate(form as CreateCourseRequest);
        } else {
            createCourseMutation.mutate(form as CreateCourseRequest);
        }
    };

    // Derived state for pending
    const isPending = createCourseMutation.isPending || updateCourseMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95%] max-w-2xl overflow-y-auto max-h-[90vh] rounded-lg p-4 md:p-6">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? "Edit Course" : "Create New Course"}</DialogTitle>
                    <DialogDescription>{isEditMode ? "Update the course details." : "Add a new course to the system."}</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    {/* Course Code */}
                    <div className="space-y-2">
                        <Label>Course Code</Label>
                        <Input
                            placeholder="e.g. CSC101"
                            value={form.courseCode || ""}
                            onChange={e => setForm({ ...form, courseCode: e.target.value })}
                        />
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <Label>Course Title</Label>
                        <Input
                            placeholder="e.g. Intro to CS"
                            value={form.title || ""}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                        />
                    </div>

                    {/* Credit Unit */}
                    <div className="space-y-2">
                        <Label>Credit Unit</Label>
                        <Input
                            type="number"
                            value={form.creditUnit || ''}
                            onChange={e => setForm({ ...form, creditUnit: parseInt(e.target.value) })}
                        />
                    </div>

                    {/* Department */}
                    <div className="space-y-2">
                        <Label>Department</Label>
                        <Select
                            value={form.departmentId?.toString()}
                            onValueChange={(v) => setForm({ ...form, departmentId: parseInt(v) })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Department" />
                            </SelectTrigger>
                            <SelectContent>
                                {departments.map((d: any) => (
                                    d?.id ? <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem> : null
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Level */}
                    <div className="space-y-2">
                        <Label>Level</Label>
                        <Select
                            value={form.levelId?.toString()}
                            onValueChange={(v) => setForm({ ...form, levelId: parseInt(v) })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Level" />
                            </SelectTrigger>
                            <SelectContent>
                                {levels.map((l: any) => (
                                    <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Programme Type */}
                    <div className="space-y-2">
                        <Label>Programme Type</Label>
                        <Select
                            value={form.programmeTypeId?.toString()}
                            onValueChange={(v) => setForm({ ...form, programmeTypeId: parseInt(v) })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent>
                                {programmeTypes.map((pt: any) => (
                                    <SelectItem key={pt.id} value={pt.id.toString()}>{pt.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Course Span */}
                    <div className="space-y-2">
                        <Label>Course Span</Label>
                        <Select
                            value={form.courseSpan?.toString()}
                            onValueChange={(v) => setForm({ ...form, courseSpan: parseInt(v) })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Scope" />
                            </SelectTrigger>
                            <SelectContent>
                                {courseSpans.map((cs) => (
                                    <SelectItem key={cs.id} value={cs.id.toString()}>{cs.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Programme (Conditional) */}
                    {form.courseSpan === 1104 && (
                        <div className="space-y-2">
                            <Label>Programme</Label>
                            <Select
                                value={form.programme?.toString()}
                                onValueChange={(v) => setForm({ ...form, programme: parseInt(v) })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Programme" />
                                </SelectTrigger>
                                <SelectContent>
                                    {programmes.map((p: any) => (
                                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Compulsory */}
                    <div className="col-span-1 md:col-span-2 flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="compulsory"
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={form.compulsory || false}
                            onChange={(e) => setForm({ ...form, compulsory: e.target.checked })}
                        />
                        <Label htmlFor="compulsory" className="mb-0">Is Compulsory?</Label>
                    </div>

                    <div className="col-span-1 md:col-span-2 flex flex-col-reverse md:flex-row justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full md:w-auto">Cancel</Button>
                        <Button type="submit" disabled={isPending} className="w-full md:w-auto">
                            {isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : (
                                isEditMode ? <Edit className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />
                            )}
                            {isEditMode ? "Update Course" : "Create Course"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CourseFormModal;
