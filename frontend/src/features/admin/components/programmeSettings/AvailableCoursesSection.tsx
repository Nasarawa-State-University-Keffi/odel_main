import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { programmeSettingsService } from "../../services/programmeSettingsService";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/admin/components/admission/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/admin/components/admission/components/ui/table";
import { Loader2, AlertCircle, CheckSquare, Square, PlusCircle, Upload } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/features/admin/components/admission/components/ui/alert";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import { Checkbox } from "@/features/admin/components/admission/components/ui/checkbox";
import RegisterCourseModal from "./RegisterCourseModal";
import UploadCoursesModal from "./UploadCoursesModal";

interface AvailableCoursesSectionProps {
    selectedProgramme: string;
    selectedLevel: string;
    selectedSemester: string;
    selectedProgrammeType: string;
}

const AvailableCoursesSection = ({
    selectedProgramme,
    selectedLevel,
    selectedSemester,
    selectedProgrammeType
}: AvailableCoursesSectionProps) => {
    const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const { data: courses, isPending, error, refetch } = useQuery({
        queryKey: ["unregistered-courses", selectedProgramme, selectedLevel, selectedSemester],
        queryFn: () => programmeSettingsService.fetchUnregisteredCourses({
            programme: Number(selectedProgramme),
            level: Number(selectedLevel),
            semester: Number(selectedSemester)
        }),
        enabled: !!selectedProgramme && !!selectedLevel && !!selectedSemester,
    });

    const toggleCourse = (id: number) => {
        setSelectedCourseIds(prev =>
            prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedCourseIds.length === courses?.length) {
            setSelectedCourseIds([]);
        } else {
            setSelectedCourseIds(courses?.map((c: any) => c.id) || []);
        }
    };

    if (isPending) {
        return (
            <div className="flex flex-col items-center justify-center p-12 min-h-[200px]">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="mt-4 font-bold text-slate-600 animate-pulse uppercase tracking-widest text-xs">Fetching Available Courses...</p>
            </div>
        );
    }

    if (error) {
        const err = error as any;
        const status = err?.response?.status;
        const message = err?.response?.data?.message || err?.response?.data;

        return (
            <Alert variant="destructive" className="rounded-3xl border-2 shadow-sm mb-6">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle className="text-lg font-black tracking-tight">Failed to fetch available courses</AlertTitle>
                <AlertDescription className="font-medium mt-1">
                    {status === 400 ? (
                        message?.toLowerCase().includes("level") ? "The selected Level could not be found." :
                            message?.toLowerCase().includes("programme") ? "The selected Programme could not be found." :
                                message?.toLowerCase().includes("semester") ? "The selected Semester could not be found for available courses." :
                                    message || "Invalid request for available courses."
                    ) : (
                        message || "An error occurred while fetching courses available for registration."
                    )}
                </AlertDescription>
                <Button variant="outline" size="sm" className="mt-4 bg-white/20 border-white/40 font-bold" onClick={() => refetch()}>
                    Retry
                </Button>
            </Alert>
        );
    }

    return (
        <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white mt-8 border-t-4 border-t-amber-400">
            <CardHeader className="bg-slate-50/40 border-b border-slate-100/50 py-4 px-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                        <CardTitle className="text-lg font-black tracking-tight text-slate-800">Available for Registration</CardTitle>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsUploadModalOpen(true)}
                            className="bg-white border-dashed border-slate-300 text-slate-600 hover:text-slate-800 hover:bg-slate-50 gap-2 font-bold text-xs uppercase tracking-wider h-9 rounded-lg"
                        >
                            <Upload className="h-3.5 w-3.5" />
                            Upload Excel
                        </Button>

                        {selectedCourseIds.length > 0 && (
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={() => setIsRegisterModalOpen(true)}
                                    className="bg-[#01402c] hover:bg-[#01402c]/90 text-white gap-2 font-black text-[10px] uppercase tracking-widest px-6 h-10 rounded-xl shadow-lg shadow-emerald-900/10 transition-all hover:scale-105 active:scale-95"
                                >
                                    <PlusCircle className="h-4 w-4" />
                                    Register {selectedCourseIds.length} Selected
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden">
                {!courses?.length ? (
                    <div className="p-12 text-center text-muted-foreground italic text-sm font-medium">
                        No additional courses available for this selection.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-slate-50 bg-slate-50/30">
                                    <TableHead className="w-12 px-6">
                                        <Checkbox
                                            checked={selectedCourseIds.length === courses.length && courses.length > 0}
                                            onCheckedChange={toggleAll}
                                            className="rounded-lg data-[state=checked]:bg-amber-500 border-amber-500/30"
                                        />
                                    </TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest h-12">Code</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest h-12">Course Title</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest h-12 text-right pr-6">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {courses.map((c: any) => (
                                    <TableRow
                                        key={c.id}
                                        className={`border-slate-50 group transition-all cursor-pointer ${selectedCourseIds.includes(c.id) ? 'bg-amber-50/30' : 'hover:bg-slate-50/50'
                                            }`}
                                        onClick={() => toggleCourse(c.id)}
                                    >
                                        <TableCell className="px-6 py-3.5" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={selectedCourseIds.includes(c.id)}
                                                onCheckedChange={() => toggleCourse(c.id)}
                                                className="rounded-lg data-[state=checked]:bg-amber-500 border-amber-500/30"
                                            />
                                        </TableCell>
                                        <TableCell className="font-bold py-3.5">
                                            <span className="text-[#01402c] text-xs px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-100/50">
                                                {c.courseCode}
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-semibold text-slate-700 text-xs py-3.5">
                                            {c.title}
                                        </TableCell>
                                        <TableCell className="text-right py-3.5 pr-6" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-primary font-bold hover:bg-primary/5 rounded-xl h-8"
                                                onClick={() => {
                                                    setSelectedCourseIds([c.id]);
                                                    setIsRegisterModalOpen(true);
                                                }}
                                            >
                                                Register
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>

            <RegisterCourseModal
                open={isRegisterModalOpen}
                onOpenChange={setIsRegisterModalOpen}
                programmeId={Number(selectedProgramme)}
                programmeTypeId={Number(selectedProgrammeType)}
                levelId={Number(selectedLevel)}
                semesterId={Number(selectedSemester)}
                selectedCourses={selectedCourseIds}
                onSuccess={() => {
                    setSelectedCourseIds([]);
                    refetch();
                }}
            />

            <UploadCoursesModal
                open={isUploadModalOpen}
                onOpenChange={setIsUploadModalOpen}
                programmeId={Number(selectedProgramme)}
                semesterId={Number(selectedSemester)}
                onSuccess={() => refetch()}
            />
        </Card>
    );
};

export default AvailableCoursesSection;
