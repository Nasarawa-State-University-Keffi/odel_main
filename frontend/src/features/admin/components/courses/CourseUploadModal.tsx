import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { courseService } from "@/features/admin/services/courseService";
import { programmeTypeService } from "@/features/admin/services/programmeTypeService";
import { levelService } from "@/features/admin/services/levelService";
import { staffService } from "@/features/admin/services/staffService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Upload, AlertCircle, FileSpreadsheet, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CourseUploadModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const CourseUploadModal = ({ open, onOpenChange }: CourseUploadModalProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [file, setFile] = useState<File | null>(null);
    const [programmeTypeId, setProgrammeTypeId] = useState<string>("");
    const [levelId, setLevelId] = useState<string>("");
    const [uploadResult, setUploadResult] = useState<any>(null);

    // Fetch Programme Types and Levels
    const { data: programmeTypes = [] } = useQuery({
        queryKey: ["programme-types"],
        queryFn: programmeTypeService.getAllProgrammeTypes,
        enabled: open
    });

    const { data: levels = [] } = useQuery({
        queryKey: ["levels", programmeTypeId],
        queryFn: () => levelService.getAllLevels(Number(programmeTypeId)),
        enabled: open && !!programmeTypeId
    });

    const uploadMutation = useMutation({
        mutationFn: async () => {
            if (!file || !programmeTypeId || !levelId) throw new Error("Please fill all fields");
            return courseService.uploadCourses(file, Number(programmeTypeId), Number(levelId));
        },
        onSuccess: (data) => {
            setUploadResult(data);
            queryClient.invalidateQueries({ queryKey: ["courses"] });
            toast({
                title: "Upload Processed",
                description: `Processed with ${data.success} successes and ${data.failed} failures.`,
                variant: data.failed > 0 ? "destructive" : "default",
            });
        },
        onError: (error: any) => {
            let message = "Upload failed.";
            const status = error.response?.status;
            if (status === 400) message = "Invalid data. Check programme type and level.";
            else if (status === 403) message = "Access denied.";

            toast({
                title: "Upload Failed",
                description: message,
                variant: "destructive",
            });
        }
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setUploadResult(null); // Reset previous results
        }
    };

    const handleClose = () => {
        onOpenChange(false);
        setFile(null);
        setProgrammeTypeId("");
        setLevelId("");
        setUploadResult(null);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5 text-primary" />
                        Batch Upload Courses
                    </DialogTitle>
                    <DialogDescription>
                        Upload an Excel file containing course details. Ensure correct format.
                    </DialogDescription>
                </DialogHeader>

                {!uploadResult ? (
                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Programme Type</Label>
                                <Select value={programmeTypeId} onValueChange={setProgrammeTypeId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {programmeTypes.map((type: any) => (
                                            <SelectItem key={type.id} value={type.id.toString()}>
                                                {type.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Level</Label>
                                <Select value={levelId} onValueChange={setLevelId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {levels.map((lvl: any) => (
                                            <SelectItem key={lvl.id} value={lvl.id.toString()}>
                                                {lvl.name || lvl.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Excel File</Label>
                            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-muted/50 hover:bg-muted transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <FileSpreadsheet className="h-10 w-10 text-muted-foreground mb-2" />
                                <p className="text-sm font-medium">
                                    {file ? file.name : "Click to select or drag file here"}
                                </p>
                                <p className="text-xs text-muted-foreground">Supported formats: .xlsx, .xls</p>
                            </div>
                        </div>

                        {uploadMutation.isError && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>
                                    An error occurred while uploading. Please try again.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                ) : (
                    <div className="py-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg flex items-center gap-3 border border-green-100 dark:border-green-900/50">
                                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                                <div>
                                    <p className="text-sm font-medium text-green-900 dark:text-green-100">Successful Uploads</p>
                                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{uploadResult.success}</p>
                                </div>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg flex items-center gap-3 border border-red-100 dark:border-red-900/50">
                                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                                <div>
                                    <p className="text-sm font-medium text-red-900 dark:text-red-100">Failed Entries</p>
                                    <p className="text-2xl font-bold text-red-700 dark:text-red-300">{uploadResult.failed}</p>
                                </div>
                            </div>
                        </div>

                        {uploadResult.errors && uploadResult.errors.length > 0 && (
                            <div className="border rounded-md mt-4">
                                <div className="bg-muted px-4 py-2 text-sm font-medium border-b">Error Log</div>
                                <div className="max-h-[200px] overflow-y-auto p-2 space-y-1 bg-background">
                                    {uploadResult.errors.map((err: string, idx: number) => (
                                        <div key={idx} className="text-xs text-destructive flex gap-2 items-start p-1 hover:bg-muted/50 rounded">
                                            <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                            <span>{err}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter className="gap-2 sm:justify-between">
                    {uploadResult ? (
                        <Button className="w-full" onClick={handleClose}>Close</Button>
                    ) : (
                        <>
                            <Button variant="outline" onClick={handleClose}>Cancel</Button>
                            <Button
                                onClick={() => uploadMutation.mutate()}
                                disabled={!file || !programmeTypeId || !levelId || uploadMutation.isPending}
                            >
                                {uploadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Upload Courses
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
