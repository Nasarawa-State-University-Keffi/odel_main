
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, Building2, BookOpen, GraduationCap } from "lucide-react";
import { staffService } from "../../services/staffService";
import { studentService } from "../../services/studentService";

const StaffOverviewCards = () => {
    // 1. Fetch Faculties Count (Moved up for dependency)
    const { data: facultiesData, isLoading: isLoadingFaculties } = useQuery({
        queryKey: ["faculties", "all"],
        queryFn: staffService.getAllFaculties,
        staleTime: 30 * 60 * 1000,
    });

    const odelFacultyId = useMemo(() => {
        if (!facultiesData) return null;
        const faculty = facultiesData.find((f: any) =>
            f.code?.toLowerCase() === 'odel' ||
            f.name?.toLowerCase().includes('open distance')
        );
        return faculty?.id;
    }, [facultiesData]);



    // 2. Fetch Student Count (Filtered by ODEL Faculty)
    const { data: studentData, isLoading: isLoadingStudents } = useQuery({
        queryKey: ["students", "odel-count", odelFacultyId],
        queryFn: () => studentService.getAllStudents({
            page: 0,
            size: 1,
            faculty: odelFacultyId!
        }),
        enabled: !!odelFacultyId,
        staleTime: 5 * 60 * 1000,
    });
    const { data: staffData, isLoading: isLoadingStaff } = useQuery({
        queryKey: ["staffs", "faculty", odelFacultyId],
        queryFn: () => staffService.getLecturersByFaculty(odelFacultyId!),
        enabled: !!odelFacultyId,
        staleTime: 5 * 60 * 1000,
    });



    // 3. Fetch Departments Count
    const { data: departmentsData, isLoading: isLoadingDepts } = useQuery({
        queryKey: ["departments", "all"],
        queryFn: staffService.getAllDepartments,
        staleTime: 30 * 60 * 1000,
    });



    const stats = [
        {
            title: "Total Staff",
            value: staffData?.length?.toLocaleString() || "0",
            change: "Active Members",
            changeLabel: "Currently registered",
            icon: Users,
            bgGradient: "from-blue-500/20 to-blue-500/5",
            iconBg: "bg-blue-500",
            isLoading: isLoadingStaff
        },
        {
            title: "Total Students",
            value: studentData?.totalElements?.toLocaleString() || "0",
            change: "ODEL Students",
            changeLabel: "Currently enrolled",
            icon: BookOpen,
            bgGradient: "from-amber-500/20 to-amber-500/5",
            iconBg: "bg-amber-500",
            isLoading: isLoadingStudents
        },
        {
            title: "Departments",
            value: departmentsData?.filter((d: any) => d.faculty?.id === odelFacultyId)?.length?.toString() || "0",
            change: "Academic Units",
            changeLabel: "Operational",
            icon: Building2,
            bgGradient: "from-emerald-500/20 to-emerald-500/5",
            iconBg: "bg-emerald-500",
            isLoading: isLoadingDepts
        },
        {
            title: "Faculty",
            value: odelFacultyId ? "1" : "0",
            change: "Major Divisions",
            changeLabel: "Available",
            icon: GraduationCap,
            trend: "",
            bgGradient: "from-purple-500/20 to-purple-500/5",
            iconBg: "bg-purple-500",
            isLoading: isLoadingFaculties
        },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
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
                                        <span className="text-4xl md:text-5xl font-black tracking-tight text-foreground">{stat.value}</span>
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


export default StaffOverviewCards;
