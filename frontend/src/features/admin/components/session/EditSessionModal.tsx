import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sessionService } from "../../services/sessionService";
import { programmeTypeService } from "../../services/programmeTypeService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Session } from "../../types/session";

const schema = z.object({
    name: z.string().min(1, "Name is required"),
    registrationBegins: z.string().min(1, "Required"),
    registrationEnds: z.string().min(1, "Required"),
    semestersCount: z.coerce.number().min(1),
    programmeTypeId: z.string().min(1, "Required"),
    feePaymentMode: z.string().min(1, "Required"),
    openForPayment: z.boolean(),
    latePaymentEnabled: z.boolean(),
    sessionGroupingEnabled: z.boolean(),
    enableRegistrationApproval: z.boolean(),
    latePaymentDate: z.string().optional(),
}).refine((data) => {
    if (data.latePaymentEnabled && !data.latePaymentDate) {
        return false;
    }
    return true;
}, {
    message: "Late payment date is required when enabled",
    path: ["latePaymentDate"],
});

interface EditSessionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    session: Session | null;
}

const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16); // Simplistic UTC handling, ideally use date-fns format
};

const EditSessionModal = ({ open, onOpenChange, session }: EditSessionModalProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: allProgrammeTypes } = useQuery({
        queryKey: ["programmeTypes"],
        queryFn: programmeTypeService.getAllProgrammeTypes,
    });

    const programmeTypes = allProgrammeTypes?.filter(pt =>
        pt.name.toLowerCase().includes('odel') ||
        pt.name.toLowerCase().includes('distance')
    );

    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
    });

    useEffect(() => {
        if (session && open) {
            form.reset({
                name: session.name,
                registrationBegins: formatDateForInput(session.registrationBegins),
                registrationEnds: formatDateForInput(session.registrationEnds),
                semestersCount: session.semestersCount,
                programmeTypeId: session.programmeType.id.toString(),
                feePaymentMode: session.paymentMode === 'SESSION' || session.paymentMode === 1 ? "1" : "2",
                openForPayment: session.openForPayment,
                latePaymentEnabled: session.latePaymentEnabled,
                sessionGroupingEnabled: session.sessionGroupingEnabled,
                enableRegistrationApproval: session.enableRegistrationApproval,
                latePaymentDate: formatDateForInput(session.latePaymentDate),
            });
        }
    }, [session, open, form]);

    const mutation = useMutation({
        mutationFn: (data: any) => sessionService.updateSession(session!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sessions"] });
            toast({ title: "Success", description: "Session updated successfully." });
            onOpenChange(false);
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update session.",
                variant: "destructive",
            });
        },
    });

    const onSubmit = (values: z.infer<typeof schema>) => {
        if (!session) return;
        mutation.mutate({
            name: values.name,
            semestersCount: values.semestersCount,
            openForPayment: values.openForPayment,
            latePaymentEnabled: values.latePaymentEnabled,
            sessionGroupingEnabled: values.sessionGroupingEnabled,
            enableRegistrationApproval: values.enableRegistrationApproval,
            programmeTypeId: Number(values.programmeTypeId),
            feePaymentMode: Number(values.feePaymentMode),
            registrationBegins: new Date(values.registrationBegins),
            registrationEnds: new Date(values.registrationEnds),
            latePaymentDate: values.latePaymentDate ? new Date(values.latePaymentDate) : null,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Session</DialogTitle>
                    <DialogDescription>Modify session configuration.</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Session Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="programmeTypeId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Programme Type</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {programmeTypes?.map((pt) => (
                                                    <SelectItem key={pt.id} value={pt.id.toString()}>
                                                        {pt.name}
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
                                name="registrationBegins"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Registration Start</FormLabel>
                                        <FormControl>
                                            <Input type="datetime-local" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="registrationEnds"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Registration End</FormLabel>
                                        <FormControl>
                                            <Input type="datetime-local" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="semestersCount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Semesters Count</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="feePaymentMode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fee Payment Mode</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select mode" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="1">Session (Once)</SelectItem>
                                                <SelectItem value="2">Semester (Per Semester)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-slate-50">
                            <FormField
                                control={form.control}
                                name="openForPayment"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg p-2">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Open for Payment</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="enableRegistrationApproval"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg p-2">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Approval Required</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="sessionGroupingEnabled"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg p-2">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Enable Grouping</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="border p-4 rounded-lg bg-slate-50">
                            <FormField
                                control={form.control}
                                name="latePaymentEnabled"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg p-2 mb-2">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Enable Late Payment</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            {form.watch('latePaymentEnabled') && (
                                <FormField
                                    control={form.control}
                                    name="latePaymentDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Late Payment Deadline</FormLabel>
                                            <FormControl>
                                                <Input type="datetime-local" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Session
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default EditSessionModal;
