import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/features/admin/components/admission/components/ui/dialog";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import { Label } from "@/features/admin/components/admission/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/admin/components/admission/components/ui/select";
import { Loader2, Download, FileSpreadsheet } from "lucide-react";
import { ScrollArea } from "@/features/admin/components/admission/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { admissionService } from "@/features/admin/services/admissionService";
import { sessionService } from "@/features/admin/services/sessionService";
import { facultyService } from "@/features/admin/services/facultyService";
import { departmentService } from "@/features/admin/services/departmentService";
import { programmeTypeService } from "@/features/admin/services/programmeTypeService";
import { levelService } from "@/features/admin/services/levelService";
import { staffService } from "@/features/admin/services/staffService";
import { studentService } from "@/features/admin/services/studentService";
import { toast } from "@/features/admin/components/admission/components/ui/use-toast";

interface StudentReportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const StudentReportModal = ({ open, onOpenChange }: StudentReportModalProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [startSession, setStartSession] = useState<string>("");
    const [currentSession, setCurrentSession] = useState<string>("");
    const [selectedFaculty, setSelectedFaculty] = useState<string>("");
    const [selectedDepartment, setSelectedDepartment] = useState<string>("");
    const [selectedProgramme, setSelectedProgramme] = useState<string>("");
    const [selectedLevel, setSelectedLevel] = useState<string>("");
    const [selectedGender, setSelectedGender] = useState<string>("");

    // Fetch Metadata
    const { data: sessions = [] } = useQuery({
        queryKey: ["sessions"],
        queryFn: sessionService.getAllSessions,
    });

    const { data: faculties = [] } = useQuery({
        queryKey: ["faculties"],
        queryFn: facultyService.getAllFaculties,
    });

    const { data: programmes = [] } = useQuery({
        queryKey: ["programmes"],
        queryFn: programmeTypeService.getAllProgrammeTypes,
    });

    const { data: departments = [] } = useQuery({
        queryKey: ["all-departments"],
        queryFn: departmentService.getAllDepartments,
    });

    const { data: levels = [] } = useQuery({
        queryKey: ["levels", selectedProgramme],
        queryFn: () => selectedProgramme ? levelService.getAllLevels(Number(selectedProgramme)) : Promise.resolve([]),
        enabled: !!selectedProgramme,
    });

    const handleDownload = async () => {
        try {
            setIsLoading(true);
            const params: any = {};
            if (startSession) params.start_session = Number(startSession);
            if (currentSession) params.current_session = Number(currentSession);
            if (selectedFaculty) params.faculty = Number(selectedFaculty);
            if (selectedDepartment) params.department = Number(selectedDepartment);
            if (selectedProgramme) params.programme_type = Number(selectedProgramme);
            if (selectedLevel) params.level = Number(selectedLevel);
            if (selectedGender) params.gender = Number(selectedGender);

            const blob = await studentService.downloadReport(params);

            // Create download link
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `student_report_${new Date().getTime()}.xlsx`); // Assuming Excel/CSV
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);

            toast({
                title: "Download Started",
                description: "Your report is being downloaded.",
            });
            onOpenChange(false);
        } catch (error: any) {
            console.error("Download failed", error);

            let title = "Download Failed";
            let description = "There was an error generating the report.";

            if (error.response) {
                if (error.response.data instanceof Blob) {
                    try {
                        const text = await error.response.data.text();
                        const data = JSON.parse(text);
                        if (data.message) description = data.message;
                    } catch (e) {
                        // Failed to parse blob text, use default or status text
                    }
                } else if (error.response.data?.message) {
                    description = error.response.data.message;
                }

                if (error.response.status === 404) {
                    title = "No Data Found";
                } else if (error.response.status === 422) {
                    title = "Validation Error";
                }
            }

            toast({
                variant: "destructive",
                title: title,
                description: description,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-primary" />
                        Download Student Report
                    </DialogTitle>
                    <DialogDescription>
                        Select criteria to generate specific reports.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[60vh] pr-4">
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Current Session</Label>
                                <Select value={currentSession} onValueChange={setCurrentSession}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Sessions" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sessions.map((s: any) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Admitted Session</Label>
                                <Select value={startSession} onValueChange={setStartSession}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Sessions" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sessions.map((s: any) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Faculty</Label>
                            <Select value={selectedFaculty} onValueChange={(val) => { setSelectedFaculty(val); setSelectedDepartment(""); }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Faculties" />
                                </SelectTrigger>
                                <SelectContent>
                                    {faculties.map((f: any) => <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Department</Label>
                            <Select value={selectedDepartment} onValueChange={setSelectedDepartment} disabled={!selectedFaculty}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Departments" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments
                                        .filter((d: any) => !selectedFaculty || d.faculty?.id === Number(selectedFaculty))
                                        .map((d: any) => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)
                                    }
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Programme</Label>
                                <Select value={selectedProgramme} onValueChange={(val) => { setSelectedProgramme(val); setSelectedLevel(""); }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Programmes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {programmes.map((p: any) => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Level</Label>
                                <Select value={selectedLevel} onValueChange={setSelectedLevel} disabled={!selectedProgramme}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Levels" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {levels.map((l: any) => <SelectItem key={l.id} value={l.id.toString()}>{l.title || l.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleDownload} disabled={isLoading} className="gap-2">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Download Report
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
