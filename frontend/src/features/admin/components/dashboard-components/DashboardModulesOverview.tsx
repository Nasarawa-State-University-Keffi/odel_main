import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Building2, Calendar, Globe, BookCheck } from "lucide-react";
import { schoolService } from "../../services/schoolService";
import { sessionService } from "../../services/sessionService";
import { programmeTypeService } from "../../services/programmeTypeService";
import { courseRegistrationService } from "../../services/courseRegistrationService";

const DashboardModulesOverview = () => {
    // 1. Schools (ODEL)
    const { data: allSchools, isLoading: loadingSchools } = useQuery({
        queryKey: ["schools"],
        queryFn: schoolService.getAllSchools,
    });
    const odelSchoolsCount = allSchools?.filter(s =>
        s.name.toLowerCase().includes('odel') || s.shortName.toLowerCase().includes('odel') ||
        s.name.toLowerCase().includes('distance') || s.shortName.toLowerCase().includes('distance')
    ).length || 0;

    // 2. Sessions (ODEL)
    const { data: allSessions, isLoading: loadingSessions } = useQuery({
        queryKey: ["sessions"],
        queryFn: sessionService.getAllSessions,
    });
    const odelSessions = allSessions?.filter(s =>
        s.programmeType.name.toLowerCase().includes('odel') ||
        s.programmeType.name.toLowerCase().includes('distance')
    ) || [];
    const activeSession = odelSessions.find(s => s.isOpen);

    // 3. Programme Types (ODEL)
    const { data: allProgTypes, isLoading: loadingProgTypes } = useQuery({
        queryKey: ["programmeTypes"],
        queryFn: programmeTypeService.getAllProgrammeTypes,
    });
    const odelProgTypesCount = allProgTypes?.filter(pt =>
        pt.name.toLowerCase().includes('odel') ||
        pt.name.toLowerCase().includes('distance')
    ).length || 0;

    // 4. Pending Registrations
    const currentSemesterId = activeSession?.currentSemesters?.[0]?.id;

    const { data: pendingRegistrations, isLoading: loadingRegs } = useQuery({
        queryKey: ["pendingRegistrations", currentSemesterId],
        queryFn: () => courseRegistrationService.findAllForApproval({
            semester: currentSemesterId || 0,
            stage: 1
        }),
        enabled: !!currentSemesterId,
    });
    const pendingCount = pendingRegistrations?.totalElements || 0;

    const stats = [
        {
            title: "ODEL SCHOOLS",
            value: odelSchoolsCount.toString(),
            change: "Institutions",
            changeLabel: "Currently Managed",
            icon: Building2,
            bgGradient: "from-blue-500/20 to-blue-500/5",
            iconBg: "bg-blue-500",
            isLoading: loadingSchools
        },
        {
            title: "CURRENT SESSION",
            value: activeSession ? activeSession.name : "None",
            change: "Active Session",
            changeLabel: "Academic Year",
            icon: Calendar,
            bgGradient: "from-emerald-500/20 to-emerald-500/5",
            iconBg: "bg-emerald-500",
            isLoading: loadingSessions
        },
        {
            title: "PROGRAMME TYPES",
            value: odelProgTypesCount.toString(),
            change: "Configurations",
            changeLabel: "Programme Settings",
            icon: Globe,
            bgGradient: "from-purple-500/20 to-purple-500/5",
            iconBg: "bg-purple-500",
            isLoading: loadingProgTypes
        },
        {
            title: "PENDING REG.",
            value: pendingCount.toString(),
            change: "Approvals",
            changeLabel: "Awaiting Action",
            icon: BookCheck,
            bgGradient: "from-amber-500/20 to-amber-500/5",
            iconBg: "bg-amber-500",
            isLoading: loadingRegs
        },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6"
        >
            {stats.map((stat, index) => (
                <motion.div
                    key={index}
                    variants={itemVariants}
                    className="group relative overflow-hidden rounded-[2rem] bg-background/50 border border-white/10 shadow-lg hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1"
                >
                    {/* Glass Effect & Gradient */}
                    <div className="absolute inset-0 backdrop-blur-md bg-gradient-to-br from-white/5 to-transparent opacity-100 transition-opacity duration-300" />
                    <div className={`absolute top-0 right-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-gradient-to-br ${stat.bgGradient} blur-[50px] opacity-40 group-hover:opacity-60 transition-opacity duration-500`} />

                    <div className="relative p-6 flex flex-col justify-between h-full">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3.5 rounded-2xl ${stat.bgGradient.replace('/20', '/10')} backdrop-blur-sm border border-white/10 group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                                <stat.icon className={`h-6 w-6 ${stat.iconBg.replace('bg-', 'text-')}`} />
                            </div>
                            {stat.isLoading ? (
                                <div className="h-6 w-16 bg-muted/50 rounded-full animate-pulse" />
                            ) : (
                                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-background/40 border border-white/5 backdrop-blur-sm">
                                    <div className={`h-1.5 w-1.5 rounded-full ${stat.iconBg}`} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">{stat.change}</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">{stat.title}</h3>
                            {stat.isLoading ? (
                                <div className="space-y-2 mt-2">
                                    <div className="h-8 w-24 bg-muted/50 rounded-lg animate-pulse" />
                                    <div className="h-3 w-32 bg-muted/30 rounded animate-pulse" />
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl lg:text-4xl font-black tracking-tight text-foreground">{stat.value}</span>
                                    </div>
                                    <p className="text-xs font-medium text-muted-foreground/60 pl-0.5">{stat.changeLabel}</p>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
};

export default DashboardModulesOverview;
