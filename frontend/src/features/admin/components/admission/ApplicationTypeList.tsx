import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, CalendarDays, Pencil } from "lucide-react";

import { Button } from "@/features/admin/components/admission/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/features/admin/components/admission/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/features/admin/components/admission/components/ui/card";
import { Skeleton } from "@/features/admin/components/admission/components/ui/skeleton";
import { useToast } from "@/features/admin/components/admission/components/ui/use-toast";

import { admissionService } from "../../services/admissionService";
import { useAuth } from "@/contexts/AuthContext";
import ApplicationTypeForm from "./ApplicationTypeForm";
import { ApplicationType } from "../../types/admission";

const ApplicationTypeList = () => {
    const { toast } = useToast();
    const { hasRole, isAdmin, isSuperAdmin } = useAuth();

    // Allow ADMISSION_OFFICER to access this page
    const canManageAdmission = hasRole("ADMISSION_OFFICER")

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedAppType, setSelectedAppType] = useState<ApplicationType | null>(null);

    const { data: applicationTypes, isLoading, isError } = useQuery({
        queryKey: ["applicationTypes"],
        queryFn: admissionService.getApplicationTypes,
    });

    const handleEdit = (appType: ApplicationType) => {
        setSelectedAppType(appType);
        setIsCreateOpen(true);
    };

    const handleClose = () => {
        setIsCreateOpen(false);
        setSelectedAppType(null);
    };

    if (isLoading) {
        return <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="rounded-md border">
                <div className="h-12 border-b bg-muted/50" />
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 border-b flex items-center px-4 gap-4">
                        <Skeleton className="h-4 w-full" />
                    </div>
                ))}
            </div>
        </div>;
    }

    if (isError) {
        return (
            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="text-destructive">Error Loading Application Types</CardTitle>
                    <CardDescription>
                        Failed to load application types. Please check your connection and try again.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    // Filter for ODEL only
    const odelApplicationTypes = applicationTypes?.filter(appType =>
        appType.programmeType?.name?.toUpperCase().includes("ODEL")
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Application Types (ODEL)</h2>
                    <p className="text-muted-foreground text-sm">
                        Configure application types for ODEL programmes.
                    </p>
                </div>
                {canManageAdmission && (
                    <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" /> Create Type
                    </Button>
                )}
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Programme Type</TableHead>
                            <TableHead>Fees (App/Adm)</TableHead>
                            <TableHead>Screening</TableHead>
                            <TableHead>Enabled Features</TableHead>
                            {canManageAdmission && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {odelApplicationTypes?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                                        <CalendarDays className="h-8 w-8 opacity-20" />
                                        <p>No ODEL application types found.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            odelApplicationTypes?.map((appType) => (
                                <TableRow key={appType.id}>
                                    <TableCell className="font-medium">{appType.name}</TableCell>
                                    <TableCell>{appType.programmeType?.name}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-xs">
                                            <span>App: ₦{appType.applicationFee?.toLocaleString()}</span>
                                            <span>Adm: ₦{appType.admissionFee?.toLocaleString()}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-xs">
                                            <span>Cost: ₦{appType.screeningFee?.toLocaleString()}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1 flex-wrap">
                                            {appType.utmeDetailsEnabled && <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px]">UTME</span>}
                                            {appType.ssceDetailsEnabled && <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px]">SSCE</span>}
                                            {appType.freshApplicationEnabled && <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px]">Fresh</span>}
                                        </div>
                                    </TableCell>
                                    {canManageAdmission && (
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(appType)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <ApplicationTypeForm
                open={isCreateOpen}
                onClose={handleClose}
                initialData={selectedAppType}
            />
        </div>
    );
};

export default ApplicationTypeList;
