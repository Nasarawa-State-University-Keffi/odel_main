import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/features/admin/components/admission/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/features/admin/components/admission/components/ui/tabs";
import { Badge } from "@/features/admin/components/admission/components/ui/badge";
import { ScrollArea } from "@/features/admin/components/admission/components/ui/scroll-area";
import {
    User,
    Hash,
    ShieldCheck,
} from "lucide-react";
import { StudentOverviewTab } from "./StudentOverviewTab";
import { StudentAcademicTab } from "./StudentAcademicTab";
import { StudentRegisteredCoursesTab } from "./StudentRegisteredCoursesTab";
import { StudentResultsTab } from "./StudentResultsTab";

// --- Normalize student data for UI
const normalizeStudent = (student: any) => ({
    ...student,
    programmeName: student.programme?.name,
    programmeTypeName: student.programme?.programmeType?.name || student.programmeType?.name,
    departmentName: student.programme?.department?.name || student.department?.name,
    facultyName: student.programme?.department?.faculty?.name || student.faculty?.name,
    genderName: student.gender?.name,
    stateName: student.information?.state?.name,
    lgaName: student.information?.lga?.name,
    countryName: student.information?.country?.name,
});

interface StudentDetailsModalProps {
    student: any | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentSessionId?: number;
}

const StudentDetailsModal = ({
    student,
    open,
    onOpenChange,
    currentSessionId,
}: StudentDetailsModalProps) => {

    if (!student) return null;
    const s = normalizeStudent(student);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden bg-background/95 backdrop-blur-md border border-border/50 shadow-2xl">
                <DialogHeader className="px-8 py-6 border-b border-border/50 bg-muted/5 flex-none">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                                <User className="h-8 w-8 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <DialogTitle className="text-2xl font-black tracking-tight">
                                    {s.lastName} {s.firstName} {s.middleName}
                                </DialogTitle>
                                <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Hash className="h-3 w-3" />
                                    MATRIC NO. {s.userId || "NO MATRIC NUMBER"}
                                </DialogDescription>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <Badge
                                variant={s.user?.enabled ? "default" : "destructive"}
                                className="px-3 py-1 text-[10px] uppercase tracking-widest font-black rounded-lg shadow-sm"
                            >
                                {s.user?.enabled ? "Active Student" : "Account Disabled"}
                            </Badge>
                            <span className="text-[10px] font-mono text-muted-foreground/60 flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-md">
                                <ShieldCheck className="h-3 w-3" />
                                {s.userId}
                            </span>
                        </div>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-8 border-b border-border/40 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
                        <TabsList className="w-full justify-start rounded-none bg-transparent h-14 p-0 gap-6">
                            <TabsTrigger
                                value="overview"
                                className="h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold uppercase text-[10px] tracking-widest text-muted-foreground data-[state=active]:text-foreground transition-all"
                            >
                                Overview
                            </TabsTrigger>
                            <TabsTrigger
                                value="academic"
                                className="h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold uppercase text-[10px] tracking-widest text-muted-foreground data-[state=active]:text-foreground transition-all"
                            >
                                Academic Profile
                            </TabsTrigger>
                            <TabsTrigger
                                value="courses"
                                className="h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold uppercase text-[10px] tracking-widest text-muted-foreground data-[state=active]:text-foreground transition-all"
                            >
                                Registered Courses
                            </TabsTrigger>
                            <TabsTrigger
                                value="results"
                                className="h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold uppercase text-[10px] tracking-widest text-muted-foreground data-[state=active]:text-foreground transition-all"
                            >
                                Results
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-8 max-w-5xl mx-auto space-y-8">
                            <TabsContent value="overview" className="mt-0">
                                <StudentOverviewTab student={s} />
                            </TabsContent>

                            <TabsContent value="academic" className="mt-0">
                                <StudentAcademicTab student={s} currentSessionId={currentSessionId} />
                            </TabsContent>

                            <TabsContent value="courses" className="mt-0">
                                <StudentRegisteredCoursesTab student={s} currentSessionId={currentSessionId} />
                            </TabsContent>

                            <TabsContent value="results" className="mt-0">
                                <StudentResultsTab student={s} />
                            </TabsContent>
                        </div>
                    </ScrollArea>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default StudentDetailsModal;
