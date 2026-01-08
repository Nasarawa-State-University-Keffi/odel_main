import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/features/admin/components/admission/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/features/admin/components/admission/components/ui/card";
import AdmissionList from "@/features/admin/components/admission/AdmissionList";
import AdmissionStatistics from "@/features/admin/components/admission/AdmissionStatistics";
import ApplicationTypeList from "@/features/admin/components/admission/ApplicationTypeList";
import AdmissionDocuments from "@/features/admin/components/admission/AdmissionDocuments";
import { BarChart3, ListChecks, FolderCog, FileText } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";

const AdmissionManagementPage = () => {
    const { isAdmin, isSuperAdmin } = useAuth();
    // Only Admin and SuperAdmin can view statistics
    const canViewStats = isAdmin || isSuperAdmin;

    return (
        <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/50">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h1 className="text-3xl md:text-3xl font-black tracking-tight text-[#01402c]">
                            ADMISSION <span className="text-primary">MANAGEMENT</span>
                        </h1>
                        <p className="text-muted-foreground">
                            Manage admission windows, application types, statistics, and documents.
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="admissions" className="space-y-4">
                    <TabsList className={`grid w-full md:w-[800px] ${canViewStats ? "grid-cols-4" : "grid-cols-3"}`}>
                        <TabsTrigger value="admissions" className="gap-2">
                            <ListChecks className="h-4 w-4" />
                            Admissions
                        </TabsTrigger>
                        <TabsTrigger value="app-types" className="gap-2">
                            <FolderCog className="h-4 w-4" />
                            App Types
                        </TabsTrigger>
                        <TabsTrigger value="documents" className="gap-2">
                            <FileText className="h-4 w-4" />
                            Documents
                        </TabsTrigger>
                        {canViewStats && (
                            <TabsTrigger value="stats" className="gap-2">
                                <BarChart3 className="h-4 w-4" />
                                Statistics
                            </TabsTrigger>
                        )}
                    </TabsList>

                    <TabsContent value="admissions" className="space-y-4">
                        <AdmissionList />
                    </TabsContent>

                    <TabsContent value="app-types" className="space-y-4">
                        <ApplicationTypeList />
                    </TabsContent>

                    <TabsContent value="documents" className="space-y-4">
                        <AdmissionDocuments />
                    </TabsContent>

                    {canViewStats && (
                        <TabsContent value="stats" className="space-y-4">
                            <AdmissionStatistics />
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </div>
    );
};

export default AdmissionManagementPage;
