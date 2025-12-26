import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CourseCategorySectionProps {
    title: string;
    courses: any[] | undefined;
    type: "COMPULSORY" | "REQUIRED" | "ELECTIVE";
}

const CourseCategorySection = ({ title, courses, type }: CourseCategorySectionProps) => {
    const badgeColors: Record<string, string> = {
        COMPULSORY: "bg-rose-500",
        REQUIRED: "bg-blue-500",
        ELECTIVE: "bg-emerald-500",
    };

    return (
        <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/40 border-b border-slate-100/50 py-4 px-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`h-2.5 w-2.5 rounded-full ${badgeColors[type]}`} />
                        <CardTitle className="text-lg font-black tracking-tight text-slate-800">{title}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="rounded-full font-bold text-[10px] px-2.5 bg-slate-100 text-slate-600">
                        {courses?.length || 0}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden">
                {!courses?.length ? (
                    <div className="p-8 text-center text-muted-foreground italic text-sm font-medium">
                        No courses configured.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-slate-50 bg-slate-50/30">
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest h-10 px-6">Code</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest h-10">Title</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest h-10 text-center">Units</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest h-10 text-right pr-6">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {courses.map((c: any) => (
                                    <TableRow key={c.id} className="border-slate-50 group transition-all hover:bg-slate-50/50">
                                        <TableCell className="font-bold py-3.5 px-6">
                                            <span className="text-[#01402c] text-xs px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-100/50">
                                                {c.course.courseCode}
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-semibold text-slate-700 text-xs py-3.5 max-w-[200px] truncate">
                                            {c.course.title}
                                        </TableCell>
                                        <TableCell className="text-center py-3.5">
                                            <span className="font-black text-xs text-slate-500">{c.creditUnit}</span>
                                        </TableCell>
                                        <TableCell className="text-right py-3.5 pr-6">
                                            <div className={`h-1.5 w-1.5 rounded-full ml-auto ${c.disabled ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default CourseCategorySection;
