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
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const schema = z.object({
    name: z.string().min(1, "Name is required"),
    registrationBegins: z.string().min(1, "Required"),
    registrationEnds: z.string().min(1, "Required"),
    semestersCount: z.coerce.number().min(1),
    programmeTypeId: z.string().min(1, "Required"),
    feePaymentMode: z.string().min(1, "Required"),
    openForPayment: z.boolean().default(false),
    latePaymentEnabled: z.boolean().default(false),
    sessionGroupingEnabled: z.boolean().default(false),
    enableRegistrationApproval: z.boolean().default(true),
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

interface CreateSessionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const CreateSessionModal = ({ open, onOpenChange }: CreateSessionModalProps) => {
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
        defaultValues: {
            name: "",
            semestersCount: 2,
            openForPayment: true,
            latePaymentEnabled: false,
            sessionGroupingEnabled: false,
            enableRegistrationApproval: true,
            latePaymentDate: "",
        },
    });

    const mutation = useMutation({
        mutationFn: sessionService.createSession,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sessions"] });
            toast({ title: "Success", description: "Session created successfully." });
            form.reset();
            onOpenChange(false);
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to create session.",
                variant: "destructive",
            });
        },
    });

    const onSubmit = (values: z.infer<typeof schema>) => {
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
                    <DialogTitle>Create New Session</DialogTitle>
                    <DialogDescription>Define a new academic session.</DialogDescription>
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
                                            <Input placeholder="e.g. 2024/2025" {...field} />
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
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                Create Session
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateSessionModal;
