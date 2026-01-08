import { useState } from "react";
import ProgrammeSelector from "@/features/admin/components/courses/ProgrammeSelector";
import CourseList from "@/features/admin/components/courses/CourseList";
import CourseFormModal from "@/features/admin/components/courses/CourseFormModal";
import CourseLecturersModal from "@/features/admin/components/courses/CourseLecturersModal";
import CourseFilterBar from "@/features/admin/components/courses/CourseFilterBar";
import CourseApprovalFilters from "@/features/admin/components/courses/CourseApprovalFilters";
import CourseApprovalList from "@/features/admin/components/courses/CourseApprovalList";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import { Plus, ListFilter, Library, FileCheck2 } from "lucide-react";
import { ProgrammeCourse, CourseQueryParams } from "@/features/admin/types/course";
import { useAuth } from "@/contexts/AuthContext";
import { CourseUploadModal } from "@/features/admin/components/courses/CourseUploadModal";
import { Upload } from "lucide-react";

const CoursesPage = () => {
    // Mode: 'programme' | 'advanced' | 'approval'
    const [viewMode, setViewMode] = useState<'programme' | 'advanced' | 'approval'>('programme');

    // Programme Mode State
    const [selectedProgramme, setSelectedProgramme] = useState<string>("");

    // Advanced Mode State
    const [filterParams, setFilterParams] = useState<CourseQueryParams | null>(null);

    // Approval Mode State
    const [approvalFilters, setApprovalFilters] = useState<{ sessionId: number; semesterId: number; departmentId?: number; programmeTypeId?: number; programmeId?: number; approvalLevel: string } | null>(null);

    // Common State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<ProgrammeCourse | undefined>(undefined);
    const [viewingLecturersCourse, setViewingLecturersCourse] = useState<ProgrammeCourse | null>(null);

    const { hasRole } = useAuth();
    const isDap = hasRole("DAP");

    const handleCreateCourse = () => {
        setEditingCourse(undefined);
        setIsCreateModalOpen(true);
    };

    const handleEditCourse = (course: ProgrammeCourse) => {
        setEditingCourse(course);
        setIsCreateModalOpen(true);
    };

    return (
        <div className="p-6 space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl md:text-3xl font-black tracking-tight text-[#01402c]">
                        COURSE <span className="text-primary">MANAGEMENT</span>
                    </h1>
                    <p className="text-muted-foreground font-medium">View and manage courses for ODEL programmes.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-muted/50 p-1 rounded-lg flex items-center gap-1 border border-border/50">
                        <Button
                            variant={viewMode === 'programme' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('programme')}
                            className="h-7 text-xs font-bold gap-1.5"
                        >
                            <Library className="h-3.5 w-3.5" />
                            Variables
                        </Button>
                        <Button
                            variant={viewMode === 'advanced' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('advanced')}
                            className="h-7 text-xs font-bold gap-1.5"
                        >
                            <ListFilter className="h-3.5 w-3.5" />
                            Advanced
                        </Button>
                        <Button
                            variant={viewMode === 'approval' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('approval')}
                            className="h-7 text-xs font-bold gap-1.5"
                        >
                            <FileCheck2 className="h-3.5 w-3.5" />
                            Approvals
                        </Button>
                    </div>
                    {isDap && (
                        <Button variant="outline" onClick={() => setIsUploadModalOpen(true)}>
                            <Upload className="h-4 w-4 mr-2" />
                            Import Courses
                        </Button>
                    )}
                    {isDap && (
                        <Button onClick={handleCreateCourse}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Course
                        </Button>
                    )}
                </div>
            </div>

            {viewMode === 'programme' && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start animate-in slide-in-from-left-4 duration-300">
                    {/* Left Column: Programme Selector */}
                    <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6">
                        <ProgrammeSelector
                            selectedProgramme={selectedProgramme}
                            onSelectProgramme={setSelectedProgramme}
                        />
                    </div>

                    {/* Right Column: Course List */}
                    <div className="lg:col-span-3">
                        <CourseList
                            selectedProgramme={selectedProgramme}
                            onEditCourse={handleEditCourse}
                            onViewLecturers={setViewingLecturersCourse}
                        />
                    </div>
                </div>
            )}

            {viewMode === 'advanced' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <CourseFilterBar onFilterChange={setFilterParams} />
                    <CourseList
                        filterParams={filterParams}
                        onEditCourse={handleEditCourse}
                        onViewLecturers={setViewingLecturersCourse}
                    />
                </div>
            )}

            {viewMode === 'approval' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <CourseApprovalFilters onFilterChange={setApprovalFilters} />
                    <CourseApprovalList filters={approvalFilters} />
                </div>
            )}

            <CourseFormModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                courseToEdit={editingCourse}
            />

            <CourseLecturersModal
                open={!!viewingLecturersCourse}
                onOpenChange={(open) => !open && setViewingLecturersCourse(null)}
                course={viewingLecturersCourse}
            />

            <CourseUploadModal
                open={isUploadModalOpen}
                onOpenChange={setIsUploadModalOpen}
            />
        </div>
    );
};

export default CoursesPage;
