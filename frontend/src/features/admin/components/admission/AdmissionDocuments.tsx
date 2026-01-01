import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Download, FileText, Search, AlertCircle } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";

import { admissionService } from "../../services/admissionService";
import { facultyService } from "../../services/facultyService";
import { departmentService } from "../../services/departmentService";
import { programmeService } from "../../services/programmeService";
import { levelService } from "../../services/levelService";

// Validation Schemas
const singleDownloadSchema = z.object({
    applicantId: z.string().min(1, "Applicant ID is required"),
});

const bulkDownloadSchema = z.object({
    admission: z.string().min(1, "Admission period is required"),
    faculty: z.string().optional(),
    department: z.string().optional(),
    programme: z.string().optional(),
    level: z.string().optional(),
    gender: z.string().optional(),
});

const AdmissionDocuments = () => {
    const { toast } = useToast();
    const [isDownloading, setIsDownloading] = useState(false);

    // --- DATA FETCHING ---
    const { data: activeAdmissions } = useQuery({
        queryKey: ["activeAdmissions"],
        queryFn: admissionService.getActiveAdmissions,
    });

    const { data: faculties } = useQuery({
        queryKey: ["faculties"],
        queryFn: facultyService.getAllFaculties,
    });

    const { data: departments } = useQuery({
        queryKey: ["departments"],
        queryFn: departmentService.getAllDepartments,
    });



    // --- FORMS ---
    const singleForm = useForm<z.infer<typeof singleDownloadSchema>>({
        resolver: zodResolver(singleDownloadSchema),
        defaultValues: { applicantId: "" },
    });

    const bulkForm = useForm<z.infer<typeof bulkDownloadSchema>>({
        resolver: zodResolver(bulkDownloadSchema),
        defaultValues: {
            admission: "",
            faculty: "",
            department: "",
            programme: "",
            level: "",
            gender: "",
        },
    });

    // Dependent Queries Logic
    const selectedAdmissionId = bulkForm.watch("admission");
    const selectedAdmission = activeAdmissions?.find(
        (a) => a.id.toString() === selectedAdmissionId
    );
    // @ts-ignore - Assuming nested structure exists based on business logic, fallback safely
    const programmeTypeId = selectedAdmission?.applicationType?.programmeType?.id;

    const { data: programmes } = useQuery({
        queryKey: ["programmes", programmeTypeId],
        queryFn: () => programmeService.getAllProgrammes(programmeTypeId!),
        enabled: !!programmeTypeId,
    });

    const { data: levels } = useQuery({
        queryKey: ["levels", programmeTypeId],
        queryFn: () => levelService.getAllLevels(programmeTypeId!),
        enabled: !!programmeTypeId,
    });

    // --- HANDLERS ---
    const handleSingleDownload = async (values: z.infer<typeof singleDownloadSchema>) => {
        setIsDownloading(true);
        try {
            const blob = await admissionService.getSingleAdmissionDocument(values.applicantId);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `admission_${values.applicantId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            toast({ title: "Success", description: "Document download started." });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Download Failed",
                description: error.message || "Failed to download document. Please verify the Applicant ID and try again.",
            });
        } finally {
            setIsDownloading(false);
        }
    };

    const handleBulkDownload = async (values: z.infer<typeof bulkDownloadSchema>) => {
        setIsDownloading(true);
        try {
            const params = {
                admission: Number(values.admission),
                faculty: values.faculty ? Number(values.faculty) : undefined,
                department: values.department ? Number(values.department) : undefined,
                programme: values.programme ? Number(values.programme) : undefined,
                level: values.level ? Number(values.level) : undefined,
                gender: values.gender ? Number(values.gender) : undefined,
            };

            const blob = await admissionService.getBulkAdmissionDocuments(params);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `bulk_admissions_${values.admission}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            toast({ title: "Success", description: "Bulk download started." });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Download Failed",
                description: error.message || "Failed to download documents.",
            });
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold tracking-tight">Admission Documents</h2>
                <p className="text-muted-foreground">
                    Download official admission letters and documents for applicants.
                </p>
            </div>

            <Tabs defaultValue="single" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="single">Single Download</TabsTrigger>
                    <TabsTrigger value="bulk">Bulk Download</TabsTrigger>
                </TabsList>

                {/* SINGLE DOWNLOAD TAB */}
                <TabsContent value="single" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Single Applicant Document</CardTitle>
                            <CardDescription>
                                Download the admission letter for a specific applicant by their ID.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...singleForm}>
                                <form onSubmit={singleForm.handleSubmit(handleSingleDownload)} className="space-y-4 max-w-md">
                                    <FormField
                                        control={singleForm.control}
                                        name="applicantId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Applicant ID</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input className="pl-9" placeholder="Enter Applicant ID/Username" {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Alert className="bg-muted/50">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Note</AlertTitle>
                                        <AlertDescription>
                                            Applicable only for students with status: <strong>ADMISSION_ACCEPTED</strong>, <strong>CLEARED</strong>, or <strong>STUDENT</strong>.
                                        </AlertDescription>
                                    </Alert>
                                    <Button type="submit" disabled={isDownloading}>
                                        {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                        Download Document
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* BULK DOWNLOAD TAB */}
                <TabsContent value="bulk" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Bulk Document Download</CardTitle>
                            <CardDescription>
                                Generate and download admission letters for multiple students based on filters.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...bulkForm}>
                                <form onSubmit={bulkForm.handleSubmit(handleBulkDownload)} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {/* Admission Period (Required) */}
                                        <FormField
                                            control={bulkForm.control}
                                            name="admission"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Admission Period <span className="text-destructive">*</span></FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select Admission" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {activeAdmissions?.map((adm) => (
                                                                <SelectItem key={adm.id} value={adm.id.toString()}>
                                                                    {/* @ts-ignore */}
                                                                    {adm.session?.session || adm.session?.name || "Session"} ({adm.applicationType?.name})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Optional Filters */}
                                        <FormField
                                            control={bulkForm.control}
                                            name="faculty"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Faculty</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="All Faculties" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {faculties?.map((fac) => (
                                                                <SelectItem key={fac.id} value={fac.id.toString()}>{fac.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={bulkForm.control}
                                            name="department"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Department</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="All Departments" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {departments?.map((dept) => (
                                                                <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={bulkForm.control}
                                            name="programme"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Programme</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="All Programmes" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {programmes?.map((prog) => (
                                                                <SelectItem key={prog.id} value={prog.id.toString()}>{prog.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={bulkForm.control}
                                            name="level"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Level</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="All Levels" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {levels?.map((lvl) => (
                                                                <SelectItem key={lvl.id} value={lvl.id.toString()}>{lvl.title}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={bulkForm.control}
                                            name="gender"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Gender</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="All Genders" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="1">Male</SelectItem>
                                                            <SelectItem value="2">Female</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={isDownloading}>
                                            {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                                            Generate & Download Bulk PDF
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdmissionDocuments;
