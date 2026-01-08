import { Card, CardContent, CardHeader, CardTitle } from "@/features/admin/components/admission/components/ui/card";
import { GraduationCap, BookOpen, Hash, Building2 } from "lucide-react";
import { DetailItem } from "./StudentDetailItem";

interface StudentAcademicTabProps {
    student: any;
    currentSessionId?: number;
}

export const StudentAcademicTab = ({ student: s }: StudentAcademicTabProps) => {

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/10 border-b border-border/40 py-3">
                    <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-2">
                        <GraduationCap className="h-3.5 w-3.5" />
                        Current Academic Standing
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <DetailItem label="Registration Number" value={s.registrationNumber} icon={Hash} />
                        <DetailItem label="Current Level" value={s.level?.title} icon={BookOpen} />
                        <DetailItem label="Programme" value={s.programmeName} icon={GraduationCap} />
                        <DetailItem label="Programme Type" value={s.programmeTypeName} icon={GraduationCap} />
                        <DetailItem label="Faculty" value={s.facultyName} icon={Building2} className="md:col-span-2 lg:col-span-1" />
                        <DetailItem label="Department" value={s.departmentName} icon={Building2} className="md:col-span-2" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
