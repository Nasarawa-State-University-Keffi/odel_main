import { useQuery } from "@tanstack/react-query";
import { modeOfEntryService } from "../../services/modeOfEntryService";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, CheckCircle2, XCircle, BookOpen, Clock, FileText, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ViewModeOfEntryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    modeId: number | null;
}

const ViewModeOfEntryModal = ({ open, onOpenChange, modeId }: ViewModeOfEntryModalProps) => {

    const { data: mode, isLoading, error } = useQuery({
        queryKey: ["modeOfEntry", modeId],
        queryFn: () => modeOfEntryService.getModeOfEntryById(modeId!),
        enabled: !!modeId && open,
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <FileText className="h-5 w-5 text-primary" />
                        Mode of Entry Details
                    </DialogTitle>
                    <DialogDescription>
                        Full information for the selected entry mode.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-8 space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm font-medium text-muted-foreground">Loading details...</p>
                    </div>
                ) : error ? (
                    <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm font-medium text-center">
                        Failed to load details. Please try again.
                    </div>
                ) : mode ? (
                    <div className="space-y-6">
                        {/* Header Section */}
                        <div className="flex flex-col items-center justify-center bg-muted/30 p-4 rounded-xl border border-border/50">
                            <h3 className="text-2xl font-black text-[#01402c] tracking-tight">{mode.title}</h3>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="font-mono text-xs uppercase bg-background">
                                    Code: {mode.value}
                                </Badge>
                                {(mode as any).programmeType && (
                                    <Badge variant="secondary" className="text-xs">
                                        {(mode as any).programmeType.name}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Level & Duration */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-lg border bg-card shadow-sm flex flex-col items-center text-center space-y-1">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                    <GraduationCap className="h-3 w-3" /> Entry Level
                                </span>
                                <span className="text-lg font-bold">{mode.level?.title || "N/A"}</span>
                            </div>
                            <div className="p-3 rounded-lg border bg-card shadow-sm flex flex-col items-center text-center space-y-1">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> Duration
                                </span>
                                <span className="text-lg font-bold">{mode.numberOfSemesters} Semesters</span>
                            </div>
                        </div>

                        <Separator />

                        {/* Requirements */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Requirements & Flags</h4>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border hover:bg-muted/40 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${mode.requireUtmeScores ? "bg-green-100 dark:bg-green-900/30 text-green-600" : "bg-muted text-muted-foreground"}`}>
                                        <BookOpen className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold">UTME Scores</span>
                                        <span className="text-[10px] text-muted-foreground">Is JAMB/UTME score required?</span>
                                    </div>
                                </div>
                                {mode.requireUtmeScores ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-muted-foreground/30" />}
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border hover:bg-muted/40 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${mode.requireScreeningDocuments ? "bg-green-100 dark:bg-green-900/30 text-green-600" : "bg-muted text-muted-foreground"}`}>
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold">Screening Documents</span>
                                        <span className="text-[10px] text-muted-foreground">Are docs upload required?</span>
                                    </div>
                                </div>
                                {mode.requireScreeningDocuments ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-muted-foreground/30" />}
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border hover:bg-muted/40 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${mode.useOnMatriculation ? "bg-green-100 dark:bg-green-900/30 text-green-600" : "bg-muted text-muted-foreground"}`}>
                                        <Badge className="h-4 w-4 rounded-full p-0 flex items-center justify-center bg-transparent text-current shadow-none">#</Badge>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold">Matriculation Source</span>
                                        <span className="text-[10px] text-muted-foreground">Use for matric number generation?</span>
                                    </div>
                                </div>
                                {mode.useOnMatriculation ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-muted-foreground/30" />}
                            </div>
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
};

export default ViewModeOfEntryModal;
