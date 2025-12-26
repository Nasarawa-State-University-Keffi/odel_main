import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { FloatingSelect } from "@/components/ui/floating-select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { admissionService } from "@/features/admin/services/admissionService";
import {
    Session,
    Semester,
    ApplicationType,
    CreateAdmissionRequest
} from "@/features/admin/types/admission";

const admissionSchema = z.object({
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    sessionId: z.string().or(z.number()).transform(val => Number(val)),
    semesterId: z.string().or(z.number()).transform(val => Number(val)),
    applicationTypeId: z.string().or(z.number()).transform(val => Number(val)),
    postResetPayment: z.boolean().default(true),
    mode: z.string().min(1, "Mode is required"),
});

type AdmissionFormValues = z.infer<typeof admissionSchema>;

interface CreateAdmissionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const CreateAdmissionModal = ({ open, onOpenChange, onSuccess }: CreateAdmissionModalProps) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    // Metadata State
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isSessionsLoading, setIsSessionsLoading] = useState(false);

    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [isSemestersLoading, setIsSemestersLoading] = useState(false);

    const [applicationTypes, setApplicationTypes] = useState<ApplicationType[]>([]);
    const [isAppTypesLoading, setIsAppTypesLoading] = useState(false);

    const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<AdmissionFormValues>({
        resolver: zodResolver(admissionSchema),
        defaultValues: {
            postResetPayment: true,
            mode: "SESSION"
        }
    });

    const selectedSessionId = watch("sessionId");

    // Initial Metadata Load (Sessions & App Types)
    useEffect(() => {
        if (open) {
            const fetchData = async () => {
                setIsSessionsLoading(true);
                setIsAppTypesLoading(true);
                try {
                    const results = await Promise.allSettled([
                        admissionService.getAllSessions(),
                        admissionService.getApplicationTypes()
                    ]);

                    const [sessionsResult, appTypesResult] = results;

                    if (sessionsResult.status === 'fulfilled') {
                        setSessions(sessionsResult.value);
                    } else {
                        console.error("Failed to load sessions", sessionsResult.reason);
                    }

                    if (appTypesResult.status === 'fulfilled') {
                        setApplicationTypes(appTypesResult.value);
                    } else {
                        console.error("Failed to load application types", appTypesResult.reason);
                    }
                } catch (error) {
                    console.error("Failed to load metadata", error);
                } finally {
                    setIsSessionsLoading(false);
                    setIsAppTypesLoading(false);
                }
            };
            fetchData();
        }
    }, [open]);

    // Fetch Semesters when Session Changes
    useEffect(() => {
        const fetchSemesters = async () => {
            if (!selectedSessionId) {
                setSemesters([]);
                return;
            }

            setIsSemestersLoading(true);
            try {
                const data = await admissionService.getSemestersBySession(Number(selectedSessionId));
                setSemesters(data);
            } catch (error) {
                console.error("Failed to load semesters", error);
                setSemesters([]);
            } finally {
                setIsSemestersLoading(false);
            }
        };
        fetchSemesters();
    }, [selectedSessionId]);

    const onSubmit = async (data: AdmissionFormValues) => {
        setIsLoading(true);
        try {
            // Convert to ISO string for backend
            const payload: CreateAdmissionRequest = {
                startDate: new Date(data.startDate).toISOString(),
                endDate: new Date(data.endDate).toISOString(),
                sessionId: data.sessionId,
                semesterId: data.semesterId,
                applicationTypeId: data.applicationTypeId,
                postResetPayment: data.postResetPayment,
                mode: data.mode
            };

            await admissionService.createAdmission(payload);

            toast({
                title: "Success",
                description: "Admission opened successfully",
            });
            reset();
            onSuccess();
            onOpenChange(false);
        } catch (error: unknown) {
            console.error(error);
            const err = error as any;
            toast({
                title: "Error",
                description: err.response?.data?.message || "Failed to create admission",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Open New Admission</DialogTitle>
                    <DialogDescription>
                        Configure settings for the new admission application period.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                    {/* Dates Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <FloatingInput
                            id="startDate"
                            type="date"
                            label="Start Date"
                            {...register("startDate")}
                            error={errors.startDate?.message}
                            disabled={isLoading}
                        />
                        <FloatingInput
                            id="endDate"
                            type="date"
                            label="End Date"
                            {...register("endDate")}
                            error={errors.endDate?.message}
                            disabled={isLoading}
                        />
                    </div>

                    {/* Metadata Dropdowns */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <FloatingSelect
                                label="Session"
                                options={sessions.map(s => ({ value: s.id.toString(), label: s.name }))}
                                value={watch("sessionId")?.toString() || ""}
                                onChange={(e) => setValue("sessionId", Number(e.target.value))}
                                name="sessionId"
                                disabled={isLoading}
                                isLoading={isSessionsLoading}
                            />
                            {errors.sessionId && <p className="text-sm text-destructive mt-1">{errors.sessionId.message}</p>}
                        </div>

                        <div>
                            <FloatingSelect
                                label="Semester"
                                options={semesters.map(s => ({ value: s.id.toString(), label: s.title }))}
                                value={watch("semesterId")?.toString() || ""}
                                onChange={(e) => setValue("semesterId", Number(e.target.value))}
                                name="semesterId"
                                disabled={isLoading}
                                isLoading={isSemestersLoading}
                            />
                            {errors.semesterId && <p className="text-sm text-destructive mt-1">{errors.semesterId.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <FloatingSelect
                                label="Application Type"
                                options={applicationTypes.map(t => ({ value: t.id.toString(), label: t.name }))}
                                value={watch("applicationTypeId")?.toString() || ""}
                                onChange={(e) => setValue("applicationTypeId", Number(e.target.value))}
                                name="applicationTypeId"
                                disabled={isLoading}
                                isLoading={isAppTypesLoading}
                            />
                            {errors.applicationTypeId && <p className="text-sm text-destructive mt-1">{errors.applicationTypeId.message}</p>}
                        </div>

                        <div>
                            <FloatingSelect
                                label="Admission Mode"
                                options={[
                                    { value: "SEMESTER", label: "Semester" },
                                    { value: "SESSION", label: "Session" }
                                ]}
                                value={watch("mode") || ""}
                                onChange={(e) => setValue("mode", e.target.value)}
                                name="mode"
                                disabled={isLoading}
                            />
                            {errors.mode && <p className="text-sm text-destructive mt-1">{errors.mode.message}</p>}
                        </div>
                    </div>

                    {/* Post Reset Payment Toggle */}
                    <div className="flex items-center justify-between border rounded-lg p-3 shadow-sm bg-background/50">
                        <div className="space-y-0.5">
                            <Label htmlFor="postResetPayment" className="text-sm font-medium">Post Reset Payment</Label>
                            <p className="text-xs text-muted-foreground">Enable payment requirement after reset</p>
                        </div>
                        <Switch
                            id="postResetPayment"
                            checked={watch("postResetPayment")}
                            onCheckedChange={(checked) => setValue("postResetPayment", checked as boolean)}
                            disabled={isLoading}
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? "Creating..." : "Open Admission"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog >
    );
};

export default CreateAdmissionModal;
