import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { programmeTypeService } from "../../services/programmeTypeService";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, AlertCircle, RefreshCw, BookOpen, GraduationCap, Building2, Globe, CheckCircle2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion } from "framer-motion";
import CreateProgrammeTypeModal from "./CreateProgrammeTypeModal";
import EditProgrammeTypeModal from "./EditProgrammeTypeModal";
import { ProgrammeType } from "../../types/programmeType";

const ProgrammeTypeManagement = () => {
    const { hasRole } = useAuth();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedProgrammeType, setSelectedProgrammeType] = useState<ProgrammeType | null>(null);

    const { data: allProgrammeTypes, isLoading, error, refetch } = useQuery({
        queryKey: ["programmeTypes"],
        queryFn: programmeTypeService.getAllProgrammeTypes,
    });

    const programmeTypes = allProgrammeTypes?.filter(type =>
        type.name.toLowerCase().includes('odel') ||
        type.modeOfStudy.toLowerCase().includes('distance') ||
        type.school?.name.toLowerCase().includes('odel')
    );

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <div className="flex flex-col space-y-8 p-8 w-full bg-slate-50/50 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tighter text-[#01402c]">
                        Programme Types
                    </h1>
                    <p className="text-muted-foreground font-medium text-lg">
                        Manage and view available programme types.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {hasRole("ADMIN") && (
                        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                            <Plus className="h-4 w-4" />
                            Create Type
                        </Button>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    <p className="mt-4 font-bold text-slate-600 animate-pulse uppercase tracking-widest text-xs">Loading Programme Types...</p>
                </div>
            ) : error ? (
                <Alert variant="destructive" className="rounded-3xl border-2 shadow-lg">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle className="text-lg font-black tracking-tight">Error</AlertTitle>
                    <AlertDescription className="font-medium mt-1">
                        Failed to load programme types. Please try again later.
                    </AlertDescription>
                    <Button variant="outline" className="mt-4 bg-white/20 border-white/40 font-bold" onClick={() => refetch()}>
                        Retry
                    </Button>
                </Alert>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {programmeTypes?.map((type) => (
                        <motion.div key={type.id} variants={item}>
                            <Card className="border-0 shadow-lg rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 group">
                                <div className="h-2 bg-gradient-to-r from-primary to-emerald-400" />
                                <CardHeader className="bg-white pb-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="outline" className="font-bold border-primary/20 text-primary bg-primary/5">
                                            {type.code}
                                        </Badge>
                                        {type.onlineResult && (
                                            <div title="Online Results Enabled" className="bg-emerald-100 p-1.5 rounded-full">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                            </div>
                                        )}
                                    </div>
                                    <CardTitle className="text-xl font-black text-slate-800 leading-tight">
                                        {type.name}
                                    </CardTitle>
                                    <CardDescription className="font-medium flex items-center gap-1.5 mt-1">
                                        <GraduationCap className="h-4 w-4" />
                                        {type.modeOfStudy.replace('_', ' ')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="bg-white pt-6 space-y-4">
                                    <div className="flex items-start gap-3 text-sm text-slate-600">
                                        <Building2 className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
                                        <span className="font-semibold">{type.school?.name || "Unknown School"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-600">
                                        <BookOpen className="h-4 w-4 text-slate-400 shrink-0" />
                                        <span className="font-semibold">Admission Type: <span className="text-slate-800 font-bold">{type.admissionType}</span></span>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-white border-t border-slate-100 p-4">
                                    <div className="w-full flex justify-end items-center">
                                        {hasRole("ADMIN") && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-xs font-bold text-slate-600 hover:text-primary hover:border-primary/50"
                                                onClick={() => {
                                                    setSelectedProgrammeType(type);
                                                    setIsEditModalOpen(true);
                                                }}
                                            >
                                                Edit Configuration
                                            </Button>
                                        )}
                                    </div>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                    {!programmeTypes?.length && (
                        <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                            <p className="text-muted-foreground font-medium">No programme types found.</p>
                        </div>
                    )}
                </motion.div>
            )}

            <CreateProgrammeTypeModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
            />

            <EditProgrammeTypeModal
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                programmeType={selectedProgrammeType}
            />
        </div>
    );
};

export default ProgrammeTypeManagement;
