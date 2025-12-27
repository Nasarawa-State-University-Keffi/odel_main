import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { courseRegistrationService } from "@/features/admin/services/courseRegistrationService";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApprovedRegisteredCourseDto } from "@/features/admin/types/courseRegistration";

const ApprovedList = () => {
    // Filters
    const [semesterId, setSemesterId] = useState<string>("1");
    const [searchStudent, setSearchStudent] = useState("");

    // Debounce search in real impl or just pass to query

    const { data: pageData, isLoading } = useQuery({
        queryKey: ["approved-courses", semesterId, searchStudent],
        queryFn: () => courseRegistrationService.getApprovedCourses({
            semester: Number(semesterId),
            student: searchStudent || undefined,
            page: 0,
            size: 50
        }),
        enabled: !!semesterId
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-end bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="space-y-2 w-full md:w-48">
                    <label className="text-xs font-bold uppercase text-slate-500">Semester</label>
                    <Select value={semesterId} onValueChange={setSemesterId}>
                        <SelectTrigger><SelectValue placeholder="Select Semester" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">First Semester</SelectItem>
                            <SelectItem value="2">Second Semester</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2 flex-1">
                    <label className="text-xs font-bold uppercase text-slate-500">Student Search</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by matric number or name..."
                            className="pl-9"
                            value={searchStudent}
                            onChange={(e) => setSearchStudent(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Course</TableHead>
                            <TableHead>Programme</TableHead>
                            <TableHead>Date Approved</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                    <p className="mt-2 text-slate-500 font-medium">Loading approved courses...</p>
                                </TableCell>
                            </TableRow>
                        ) : !pageData?.content?.length ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                                    No approved courses found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            pageData.content.map((reg: ApprovedRegisteredCourseDto) => (
                                <TableRow key={reg.id} className="hover:bg-slate-50/50">
                                    <TableCell>
                                        <div className="font-bold text-slate-800">{reg.student.name}</div>
                                        <div className="text-xs text-slate-500">{reg.student.userId}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-bold text-slate-800">{reg.course.courseCode}</div>
                                        <div className="text-xs text-slate-500 truncate max-w-[200px]">{reg.course.title}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-slate-600">{reg.student.programme}</div>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-600">
                                        {new Date(reg.submissionDate).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                            {reg.approval.status}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default ApprovedList;
