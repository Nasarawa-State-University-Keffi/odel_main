import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { programmeSettingsService } from "../../services/programmeSettingsService";
import { modeOfEntryService } from "../../services/modeOfEntryService";
import { admissionService } from "../../services/admissionService";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { AddCoursesToProgrammeRequest } from "../../types/programmeSettings";

interface RegisterCourseModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    programmeId: number;
    programmeTypeId: number;
    levelId: number;
    semesterId: number;
    selectedCourses: number[];
    onSuccess: () => void;
}

const RegisterCourseModal = ({
    open,
    onOpenChange,
    programmeId,
    programmeTypeId,
    levelId,
    semesterId,
    selectedCourses,
    onSuccess
}: RegisterCourseModalProps) => {
    const queryClient = useQueryClient();
    const [courseType, setCourseType] = useState<"compulsory" | "required" | "elective">("compulsory");
    const [selectedModes, setSelectedModes] = useState<number[]>([]);
    const [effectiveSessionId, setEffectiveSessionId] = useState<string>("");

    // Fetch Mode of Entries
    const { data: modes, isPending: isLoadingModes } = useQuery({
        queryKey: ["mode-of-entries", programmeTypeId],
        queryFn: () => modeOfEntryService.getAllModeOfEntries(programmeTypeId),
        enabled: open && !!programmeTypeId
    });

    // Fetch Sessions for Effective Session
    const { data: sessions, isPending: isLoadingSessions } = useQuery({
        queryKey: ["sessions"],
        queryFn: admissionService.getAllSessions,
        enabled: open
    });

    // Set default session and select all modes by default
    useEffect(() => {
        if (open && sessions && sessions.length > 0 && !effectiveSessionId) {
            const activeSession = sessions.find(s => s.isActive) || sessions[0];
            setEffectiveSessionId(activeSession.id.toString());
        }
        if (open && modes && modes.length > 0 && selectedModes.length === 0) {
            setSelectedModes(modes.map(m => m.id));
        }
    }, [open, sessions, modes]);

    const registerMutation = useMutation({
        mutationFn: (data: AddCoursesToProgrammeRequest) =>
            programmeSettingsService.addCoursesToProgramme(programmeId, data),
        onSuccess: () => {
            toast.success("Courses registered successfully", {
                description: `Successfully added ${selectedCourses.length} courses to the programme.`,
                icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            });
            queryClient.invalidateQueries({ queryKey: ["unregistered-courses"] });
            queryClient.invalidateQueries({ queryKey: ["programme-settings"] });
            onSuccess();
            onOpenChange(false);
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || "Failed to register courses.";
            toast.error("Registration failed", {
                description: message,
                icon: <AlertCircle className="h-4 w-4 text-rose-500" />
            });
        }
    });

    const handleRegister = () => {
        if (selectedModes.length === 0) {
            toast.error("Process incomplete", { description: "Please select at least one Mode of Entry." });
            return;
        }

        const payload: AddCoursesToProgrammeRequest = {
            modeOfEntries: selectedModes,
            courses: selectedCourses,
            compulsory: courseType === "compulsory",
            required: courseType === "required",
            elective: courseType === "elective",
            level: levelId,
            semesterId: semesterId,
            effectiveSessionId: Number(effectiveSessionId)
        };

        registerMutation.mutate(payload);
    };

    const toggleMode = (id: number) => {
        setSelectedModes(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] rounded-3xl border-0 shadow-2xl p-0 overflow-hidden bg-slate-50">
                <DialogHeader className="p-8 bg-white border-b border-slate-100">
                    <DialogTitle className="text-2xl font-black tracking-tight text-[#01402c]">
                        Register Courses
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 font-medium text-base">
                        Configure how the {selectedCourses.length} selected courses should be added.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-8 space-y-8 overflow-y-auto max-h-[60vh]">
                    {/* Course Type Selection */}
                    <div className="space-y-4">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Course Classification</Label>
                        <RadioGroup
                            value={courseType}
                            onValueChange={(val: any) => setCourseType(val)}
                            className="grid grid-cols-3 gap-3"
                        >
                            {["compulsory", "required", "elective"].map((type) => (
                                <div key={type} className="relative">
                                    <RadioGroupItem value={type} id={type} className="peer sr-only" />
                                    <Label
                                        htmlFor={type}
                                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-slate-100/50 ${courseType === type ? 'border-primary bg-primary/5' : 'border-slate-100 bg-white'
                                            }`}
                                    >
                                        <span className={`text-[10px] font-black uppercase tracking-wider ${courseType === type ? 'text-primary' : 'text-slate-400'}`}>
                                            {type}
                                        </span>
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    {/* Mode of Entry Selection */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Mode of Entry</Label>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[10px] font-black text-primary p-0 h-auto hover:bg-transparent"
                                onClick={() => setSelectedModes(modes?.map(m => m.id) || [])}
                            >
                                Select All
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {isLoadingModes ? (
                                <div className="flex items-center gap-2 text-slate-400 py-2"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-xs font-bold italic">Loading modes...</span></div>
                            ) : (
                                modes?.map((mode) => (
                                    <div
                                        key={mode.id}
                                        className={`flex items-center space-x-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${selectedModes.includes(mode.id) ? 'border-primary/20 bg-primary/5' : 'border-white bg-white/50 hover:bg-white'
                                            }`}
                                        onClick={() => toggleMode(mode.id)}
                                    >
                                        <Checkbox
                                            id={`mode-${mode.id}`}
                                            checked={selectedModes.includes(mode.id)}
                                            onCheckedChange={() => toggleMode(mode.id)}
                                            className="rounded-lg data-[state=checked]:bg-primary"
                                        />
                                        <Label htmlFor={`mode-${mode.id}`} className="flex-1 text-sm font-bold text-slate-700 cursor-pointer">
                                            {mode.title}
                                        </Label>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Effective Session */}
                    <div className="space-y-4 pb-4">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Effective From Session</Label>
                        <select
                            value={effectiveSessionId}
                            onChange={(e) => setEffectiveSessionId(e.target.value)}
                            className="w-full p-4 rounded-2xl border-2 border-white bg-white font-bold text-sm outline-none focus:border-primary/20 transition-all appearance-none"
                        >
                            {sessions?.map(s => (
                                <option key={s.id} value={s.id.toString()}>{s.name} {s.isActive ? '(Current)' : ''}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <DialogFooter className="p-8 bg-white border-t border-slate-100 sm:justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="rounded-2xl h-14 px-8 font-black text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    >
                        CANCEL
                    </Button>
                    <Button
                        onClick={handleRegister}
                        disabled={registerMutation.isPending || selectedCourses.length === 0}
                        className="rounded-2xl h-14 px-10 font-black shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {registerMutation.isPending ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                PROCESSING...
                            </div>
                        ) : (
                            `REGISTER ${selectedCourses.length} COURSE${selectedCourses.length > 1 ? 'S' : ''}`
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default RegisterCourseModal;
