import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, Clock, Users, GraduationCap, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { admissionService } from "@/features/admin/services/admissionService";
import { staffService } from "@/features/admin/services/staffService";
import { Badge } from "@/components/ui/badge";

interface ActiveSessionAdmissionStatsProps {
    isLoading?: boolean;
}

const ActiveSessionAdmissionStats = ({ isLoading: propLoading }: ActiveSessionAdmissionStatsProps) => {
    const [stats, setStats] = useState<any>({ registered: 0, unregistered: 0, total: 0 });
    const [activeSession, setActiveSession] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Get Active Admission Session (Filter for ODEL)
                const activeAdmissions = await admissionService.getActiveAdmissions();

                // Filter logic (mirrors useActiveAdmissions hook)
                const filter = "ODEL";
                const odelAdmission = activeAdmissions.find((admission: any) => {
                    const type = admission.programmeType;
                    const nestedType = admission.applicationType?.programmeType;

                    // Check direct string match
                    if (typeof type === 'string' && type.toUpperCase().includes(filter)) return true;

                    // Check object match (name or code)
                    if (typeof type === 'object') {
                        if (type.name?.toUpperCase().includes(filter)) return true;
                        if (type.code?.toUpperCase().includes(filter)) return true;
                    }

                    // Check nested applicationType match
                    if (nestedType) {
                        if (typeof nestedType === 'string' && nestedType.toUpperCase().includes(filter)) return true;
                        if (typeof nestedType === 'object') {
                            if (nestedType.name?.toUpperCase().includes(filter)) return true;
                            if (nestedType.code?.toUpperCase().includes(filter)) return true;
                        }
                    }
                    return false;
                });

                // 2. Get ODEL Faculty ID dynamically
                const faculties = await staffService.getAllFaculties();
                const odelFaculty = faculties.find((f: any) =>
                    f.code?.toLowerCase() === 'odel' ||
                    f.name?.toLowerCase().includes('open distance')
                );
                const odelFacultyId = odelFaculty?.id || 0;

                if (odelAdmission) {
                    setActiveSession(odelAdmission);

                    // 3. Fetch Stats for this session (ODEL Faculty + ODEL Session)
                    const statsData = await admissionService.getAdmissionStats({
                        session: odelAdmission.id,
                        faculty: odelFacultyId
                    });

                    let totalReg = 0;
                    let totalUnreg = 0;
                    if (statsData && typeof statsData === 'object') {
                        Object.values(statsData).forEach((val: any) => {
                            totalReg += Number(val.registered || 0);
                            totalUnreg += Number(val.unregistered || 0);
                        });
                    }

                    setStats({
                        registered: totalReg,
                        unregistered: totalUnreg,
                        total: totalReg + totalUnreg
                    });
                }
            } catch (error) {
                console.error("Failed to load active admission stats", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading || propLoading) {
        return (
            <div className="w-full h-full relative overflow-hidden rounded-[2rem] border border-border/20 bg-background/50 backdrop-blur-sm p-6 space-y-4">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden rounded-[2.5rem] bg-background/40 border border-white/10 shadow-xl backdrop-blur-md group">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-[80px]" />

            <div className="relative z-10 p-8 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-2">
                        <Badge variant="outline" className="w-fit px-3 py-1 border-primary/20 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-[0.2em] gap-1.5 backdrop-blur-sm">
                            <GraduationCap className="h-3.5 w-3.5" />
                            Admission Cycle
                        </Badge>
                        <div>
                            <h2 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
                                {activeSession?.name || "Current Session"}
                            </h2>
                            <p className="text-muted-foreground font-medium text-sm mt-1">
                                Real-time admission performance overview
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Primary Card - Total Admitted */}
                    <div className="lg:col-span-1 relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-primary to-primary/90 p-1 text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform duration-500 group/card">
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer opacity-0 group-hover/card:opacity-100" />
                        <div className="h-full bg-gradient-to-br from-white/10 to-transparent p-5 rounded-[1.3rem] flex flex-col justify-between relative z-10">
                            <div className="flex justify-between items-start">
                                <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl">
                                    <CheckCircle className="h-6 w-6 text-white" />
                                </div>
                                <ArrowRight className="h-5 w-5 text-white/50 group-hover/card:translate-x-1 transition-transform" />
                            </div>
                            <div className="space-y-1 mt-6">
                                <div className="text-5xl font-black tracking-tighter text-white">
                                    {stats.registered.toLocaleString()}
                                </div>
                                <div className="text-xs font-bold uppercase tracking-widest text-white/80">
                                    Admitted Students
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Cards Wrapper */}
                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Pending Card */}
                        <div className="p-6 rounded-[1.5rem] bg-background/60 border border-white/10 shadow-sm hover:shadow-md hover:bg-background/80 transition-all duration-300 flex flex-col justify-between group/pending relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 blur-[40px] rounded-full -mr-8 -mt-8" />

                            <div className="flex justify-between items-start z-10">
                                <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-600">
                                    <Clock className="h-6 w-6" />
                                </div>
                                <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border-0 font-bold px-2">
                                    PENDING
                                </Badge>
                            </div>
                            <div className="mt-4 z-10">
                                <span className="text-4xl font-black tracking-tighter text-foreground group-hover/pending:text-orange-600 transition-colors duration-300">
                                    {stats.unregistered.toLocaleString()}
                                </span>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Awaiting Registration</p>
                            </div>
                        </div>

                        {/* Total Applications Card */}
                        <div className="p-6 rounded-[1.5rem] bg-background/60 border border-white/10 shadow-sm hover:shadow-md hover:bg-background/80 transition-all duration-300 flex flex-col justify-between group/total relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-[40px] rounded-full -mr-8 -mt-8" />

                            <div className="flex justify-between items-start z-10">
                                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600">
                                    <Users className="h-6 w-6" />
                                </div>
                                <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-0 font-bold px-2">
                                    TOTAL
                                </Badge>
                            </div>
                            <div className="mt-4 z-10">
                                <span className="text-4xl font-black tracking-tighter text-foreground group-hover/total:text-blue-600 transition-colors duration-300">
                                    {stats.total.toLocaleString()}
                                </span>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Total Applications</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActiveSessionAdmissionStats;
