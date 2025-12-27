import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { UploadCoursesResponse } from "@/features/admin/types/programmeSettings";
import { programmeSettingsService } from "@/features/admin/services/programmeSettingsService";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UploadCoursesModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    programmeId: number | null;
    semesterId: number | null;
    onSuccess?: () => void;
}

const UploadCoursesModal = ({ open, onOpenChange, programmeId, semesterId, onSuccess }: UploadCoursesModalProps) => {
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadResult, setUploadResult] = useState<UploadCoursesResponse | null>(null);

    const uploadMutation = useMutation({
        mutationFn: async () => {
            if (!file || !programmeId || !semesterId) return;
            return await programmeSettingsService.uploadCourses(file, programmeId, semesterId);
        },
        onSuccess: (data) => {
            if (data) {
                setUploadResult(data);
                toast({
                    title: "Upload Processed",
                    description: `Processed with ${data.success} successes and ${data.failed} failures.`,
                });
                if (onSuccess) onSuccess();
            }
        },
        onError: (error: any) => {
            const status = error?.response?.status;
            let title = "Upload Failed";
            let description = "An error occurred while uploading. Please try again.";

            if (status === 400) {
                const msg = error?.response?.data?.message || "";
                if (msg.includes("Semester")) description = "Semester not found.";
                else if (msg.includes("Programme")) description = "Programme not found.";
                else description = msg || "Invalid request parameters.";
            } else if (status === 403) {
                title = "Access Denied";
                description = "You do not have permission to upload courses.";
            }

            toast({
                variant: "destructive",
                title,
                description,
            });
        },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setUploadResult(null); // Reset previous results on new file selection
        }
    };

    const handleUpload = () => {
        if (!file) {
            toast({
                variant: "destructive",
                title: "No File Selected",
                description: "Please select an Excel file to upload.",
            });
            return;
        }
        if (!programmeId || !semesterId) {
            toast({
                variant: "destructive",
                title: "Missing Context",
                description: "Please ensure a programme and semester are selected.",
            });
            return;
        }
        uploadMutation.mutate();
    };

    const handleClose = () => {
        setFile(null);
        setUploadResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-[#0F3F2A]">
                        <Upload className="h-5 w-5" />
                        Upload Courses via Excel
                    </DialogTitle>
                    <DialogDescription>
                        Upload a spreadsheet to bulk add courses to the selected programme and semester.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    {/* File Input Area */}
                    {!uploadResult && (
                        <div className="grid w-full items-center gap-3">
                            <Label htmlFor="file-upload" className="font-semibold text-slate-700">Select Excel File</Label>
                            <div className="flex items-center gap-3">
                                <Input
                                    id="file-upload"
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={handleFileChange}
                                    ref={fileInputRef}
                                    className="cursor-pointer file:text-[#0F3F2A] file:font-semibold file:bg-[#8cc63f]/10 file:border-0 file:rounded-md file:px-2 file:mr-3 hover:file:bg-[#8cc63f]/20"
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <FileSpreadsheet className="h-3 w-3" />
                                Supported formats: .xlsx, .xls
                            </p>
                        </div>
                    )}

                    {/* Results Display */}
                    {uploadResult && (
                        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                    <CheckCircle2 className="h-8 w-8 text-green-600 mb-2" />
                                    <span className="text-3xl font-black text-green-700">{uploadResult.success}</span>
                                    <span className="text-xs font-bold uppercase tracking-wider text-green-800/70">Successful</span>
                                </div>
                                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                    <XCircle className="h-8 w-8 text-red-600 mb-2" />
                                    <span className="text-3xl font-black text-red-700">{uploadResult.failed}</span>
                                    <span className="text-xs font-bold uppercase tracking-wider text-red-800/70">Failed</span>
                                </div>
                            </div>

                            {uploadResult.errors && uploadResult.errors.length > 0 && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50/50 overflow-hidden">
                                    <div className="bg-amber-100/50 px-4 py-2 border-b border-amber-200 flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                                        <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">Error Log</span>
                                    </div>
                                    <ScrollArea className="h-[150px] w-full p-4">
                                        <ul className="space-y-2">
                                            {uploadResult.errors.map((error, idx) => (
                                                <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                                                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                                                    {error}
                                                </li>
                                            ))}
                                        </ul>
                                    </ScrollArea>
                                </div>
                            )}

                            <Alert className="bg-blue-50 border-blue-100">
                                <AlertTitle className="text-blue-800 font-bold">Process Complete</AlertTitle>
                                <AlertDescription className="text-blue-700 text-xs">
                                    The upload has been processed. Review the stats above.
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        {uploadResult ? "Close" : "Cancel"}
                    </Button>
                    {!uploadResult && (
                        <Button
                            onClick={handleUpload}
                            disabled={!file || uploadMutation.isPending || !programmeId || !semesterId}
                            className="bg-[#8cc63f] hover:bg-[#7ab62f] text-white font-bold"
                        >
                            {uploadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Upload Courses
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default UploadCoursesModal;
