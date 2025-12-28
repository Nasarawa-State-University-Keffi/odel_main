import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { schoolService } from "../../services/schoolService";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, AlertCircle, RefreshCw, Building2, BookOpen, Settings, Crown, Plus, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion } from "framer-motion";
import CreateSchoolModal from "./CreateSchoolModal";
import EditSchoolModal from "./EditSchoolModal";
import { School } from "../../types/school";

const SchoolManagement = () => {
    const { hasRole } = useAuth();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

    const { data: allSchools, isLoading, error, refetch } = useQuery({
        queryKey: ["schools"],
        queryFn: schoolService.getAllSchools,
    });

    // Filter to strictly show ODEL related schools
    const schools = allSchools?.filter(school =>
        school.name.toLowerCase().includes('odel') ||
        school.shortName.toLowerCase().includes('odel') ||
        school.name.toLowerCase().includes('distance') ||
        school.shortName.toLowerCase().includes('distance')
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
                    <h1 className="text-3xl md:text-3xl font-black tracking-tight text-[#01402c]">
                        SCHOOL <span className="text-primary">MANAGEMENT</span>
                    </h1>
                    <p className="text-muted-foreground font-medium text-lg">
                        Manage institutions and configurations.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {hasRole("ADMIN") && (
                        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                            <Plus className="h-4 w-4" />
                            Create School
                        </Button>
                    )}

                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    <p className="mt-4 font-bold text-slate-600 animate-pulse uppercase tracking-widest text-xs">Loading Schools...</p>
                </div>
            ) : error ? (
                <Alert variant="destructive" className="rounded-3xl border-2 shadow-lg">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle className="text-lg font-black tracking-tight">Error</AlertTitle>
                    <AlertDescription className="font-medium mt-1">
                        Failed to load schools. Please try again later.
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
                    {schools?.map((school) => (
                        <motion.div key={school.id} variants={item}>
                            <Card className={`border-0 shadow-lg rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 group ${school.dominant ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                                <div className={`h-2 ${school.dominant ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-primary to-emerald-400'}`} />
                                <CardHeader className="bg-white pb-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="outline" className="font-bold border-primary/20 text-primary bg-primary/5">
                                            {school.shortName}
                                        </Badge>
                                        {school.dominant && (
                                            <div title="Dominant School" className="bg-amber-100 p-1.5 rounded-full animate-pulse">
                                                <Crown className="h-4 w-4 text-amber-600" />
                                            </div>
                                        )}
                                    </div>
                                    <CardTitle className="text-xl font-black text-slate-800 leading-tight">
                                        {school.name}
                                    </CardTitle>
                                    <CardDescription className="font-medium flex items-center gap-1.5 mt-1">
                                        <Building2 className="h-4 w-4" />
                                        Senate Label: {school.preSenateCommitteeLabel}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="bg-white pt-6 space-y-4">
                                    <div className="flex items-center gap-3 text-sm text-slate-600">
                                        <CheckCircle2 className={`h-4 w-4 shrink-0 ${school.crossProgrammeTypeChange ? 'text-emerald-500' : 'text-slate-300'}`} />
                                        <span className={school.crossProgrammeTypeChange ? 'font-semibold text-slate-700' : 'text-slate-400 line-through'}>
                                            Cross-Programme Change
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-600">
                                        <CheckCircle2 className={`h-4 w-4 shrink-0 ${school.dominant ? 'text-emerald-500' : 'text-slate-300'}`} />
                                        <span className={school.dominant ? 'font-semibold text-slate-700' : 'text-slate-400'}>
                                            Dominant Institution
                                        </span>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-white border-t border-slate-100 p-4">
                                    <div className="w-full flex justify-end">
                                        {hasRole("ADMIN") && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-xs font-bold text-slate-600 hover:text-primary hover:border-primary/50"
                                                onClick={() => {
                                                    setSelectedSchool(school);
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
                    {!schools?.length && (
                        <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                            <p className="text-muted-foreground font-medium">No schools found.</p>
                        </div>
                    )}
                </motion.div>
            )}

            <CreateSchoolModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
            />

            <EditSchoolModal
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                school={selectedSchool}
            />
        </div>
    );
};

export default SchoolManagement;
