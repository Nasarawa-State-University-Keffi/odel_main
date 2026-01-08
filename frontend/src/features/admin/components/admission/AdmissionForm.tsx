import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";

import { Button } from "@/features/admin/components/admission/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/features/admin/components/admission/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/features/admin/components/admission/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/features/admin/components/admission/components/ui/select";
import { Input } from "@/features/admin/components/admission/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/features/admin/components/admission/components/ui/popover";
import { Calendar } from "@/features/admin/components/admission/components/ui/calendar";
import { useToast } from "@/features/admin/components/admission/components/ui/use-toast";

import { admissionService } from "../../services/admissionService";
import { programmeTypeService } from "../../services/programmeTypeService";
import { sessionService } from "../../services/sessionService";
import { Admission, ApplicationType } from "../../types/admission";
import { ProgrammeType } from "../../types/programmeType";
import { Session } from "../../types/session";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const formSchema = z.object({
    sessionId: z.string().min(1, "Session is required"),
    programmeTypeId: z.string().min(1, "Programme Type is required"),
    applicationTypeId: z.string().min(1, "Application Type is required"),
    startDate: z.date({ required_error: "Start date is required" }),
    endDate: z.date({ required_error: "End date is required" }),
    admissionMode: z.string().min(1, "Admission Mode is required"),
    postResetPayment: z.coerce.number().min(0, "Amount must be positive"),
    semesterId: z.string().optional(),
});

interface AdmissionFormProps {
    open: boolean;
    onClose: () => void;
    initialData: Admission | null;
}

const AdmissionForm = ({ open, onClose, initialData }: AdmissionFormProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [applicationTypes, setApplicationTypes] = useState<ApplicationType[]>([]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            sessionId: "",
            programmeTypeId: "",
            applicationTypeId: "",
            admissionMode: "SESSION",
            postResetPayment: 0,
            semesterId: "",
        },
    });

    const { data: programmeTypes, isLoading: isLoadingProgTypes } = useQuery({
        queryKey: ["programmeTypes"],
        queryFn: programmeTypeService.getAllProgrammeTypes,
    });

    const { data: sessions, isLoading: isLoadingSessions } = useQuery({
        queryKey: ["sessions"],
        queryFn: sessionService.getAllSessions,
    });

    // Get current session for semester Logic
    const selectedSessionId = form.watch("sessionId");
    const currentSession = sessions?.find(s => s.id.toString() === selectedSessionId);
    const semesters = currentSession?.semesters || [];

    const selectedMode = form.watch("admissionMode");

    // Watch for Programme Type changes to fetch Application Types
    const selectedProgrammeTypeId = form.watch("programmeTypeId");
    useEffect(() => {
        if (selectedProgrammeTypeId) {
            const fetchAppTypes = async () => {
                try {
                    const types = await admissionService.getApplicationTypesForProgramme(Number(selectedProgrammeTypeId));
                    setApplicationTypes(types);
                } catch (error) {
                    toast({
                        variant: "destructive",
                        title: "Error fetching application types",
                        description: "Could not load application types for the selected programme.",
                    });
                }
            };
            fetchAppTypes();
        } else {
            setApplicationTypes([]);
        }
    }, [selectedProgrammeTypeId, toast]);

    // Populate form when initialData changes (Edit Mode)
    useEffect(() => {
        if (initialData) {
            form.reset({
                sessionId: initialData.session?.id.toString(),
                programmeTypeId: initialData.applicationType?.programmeType?.id.toString(),
                applicationTypeId: initialData.applicationType?.id.toString(),
                startDate: new Date(initialData.startDate),
                endDate: new Date(initialData.endDate),
                admissionMode: initialData.admissionMode || "SESSION",
                postResetPayment: initialData.postResetPayment || 0,
                semesterId: initialData.semester?.id?.toString() || "",
            });
        } else {
            form.reset({
                sessionId: "",
                programmeTypeId: "",
                applicationTypeId: "",
                startDate: undefined,
                endDate: undefined,
                admissionMode: "SESSION",
                postResetPayment: 0,
                semesterId: "",
            });
        }
    }, [initialData, form]);

    const mutation = useMutation({
        mutationFn: (values: z.infer<typeof formSchema>) => {
            const payload: any = {
                sessionId: Number(values.sessionId),
                applicationTypeId: Number(values.applicationTypeId),
                startDate: values.startDate.toISOString(),
                endDate: values.endDate.toISOString(),
                mode: values.admissionMode, // NOTE: Changed to 'mode' for Create per request
                postResetPayment: Number(values.postResetPayment),
            };

            if (values.admissionMode === "SEMESTER" && values.semesterId) {
                payload.semesterId = Number(values.semesterId);
            }

            if (initialData) {
                // The UpdateAdmissionRequest now matches the full payload structure.
                return admissionService.updateAdmission(initialData.id, payload);
            } else {
                return admissionService.createAdmission(payload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admissions"] });
            toast({
                title: initialData ? "Admission Updated" : "Admission Created",
                description: "The admission window has been successfully saved.",
            });
            onClose();
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to save admission.",
            });
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        if (values.admissionMode === "SEMESTER" && !values.semesterId) {
            form.setError("semesterId", { message: "Semester is required for Semester Mode" });
            return;
        }
        mutation.mutate(values);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Admission Window" : "Create Admission Window"}</DialogTitle>
                    <DialogDescription>
                        Configure the admission settings, dates, and application type.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="sessionId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Session</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Session" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="max-h-[300px] overflow-y-auto">
                                                {sessions?.map((session) => (
                                                    <SelectItem key={session.id} value={session.id.toString()}>
                                                        {session.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="admissionMode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mode</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Mode" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="SESSION">Session</SelectItem>
                                                <SelectItem value="SEMESTER">Semester</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Semester Selection - Conditional */}
                        {selectedMode === "SEMESTER" && (
                            <div className="grid grid-cols-1 gap-4">
                                <FormField
                                    control={form.control}
                                    name="semesterId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Semester</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={!selectedSessionId}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={!selectedSessionId ? "Select Session First" : "Select Semester"} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {semesters.map((sem) => (
                                                        <SelectItem key={sem.id} value={sem.id.toString()}>
                                                            {sem.title || `Semester ${sem.id}`}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                            <FormField
                                control={form.control}
                                name="programmeTypeId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Programme Type</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Programme Type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {programmeTypeService.getAllProgrammeTypes ? (
                                                    programmeTypes?.map((pt) => (
                                                        <SelectItem key={pt.id} value={pt.id.toString()}>
                                                            {pt.name}
                                                        </SelectItem>
                                                    ))
                                                ) : <SelectItem value="loading" disabled>Loading...</SelectItem>}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <FormField
                                control={form.control}
                                name="applicationTypeId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Application Type</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            value={field.value}
                                            disabled={!selectedProgrammeTypeId || applicationTypes.length === 0}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={
                                                        !selectedProgrammeTypeId ? "Select Programme Type first" :
                                                            applicationTypes.length === 0 ? "No types found" :
                                                                "Select Application Type"
                                                    } />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {applicationTypes.map((apt) => (
                                                    <SelectItem key={apt.id} value={apt.id.toString()}>
                                                        {apt.name} (₦{apt.amount})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="postResetPayment"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Post Reset Payment (₦)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                {...field}
                                                onChange={e => field.onChange(e.target.value)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Start Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP")
                                                        ) : (
                                                            <span>Pick a date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date < new Date("1900-01-01")
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>End Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP")
                                                        ) : (
                                                            <span>Pick a date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date < new Date("1900-01-01")
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {initialData ? "Update" : "Create"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default AdmissionForm;
