
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import StatsCard from "./StatsCard";
import { Users, Building2, BookOpen, GraduationCap } from "lucide-react";
import { staffService } from "../services/staffService";

const StaffOverviewCards = () => {
    // 1. Fetch Total Staff Count
    const { data: staffData } = useQuery({
        queryKey: ["staffs", "count"],
        queryFn: () => staffService.getAllStaffPaginated(0, 1),
        staleTime: 5 * 60 * 1000,
    });

    // 2. Fetch Titles/Designations Count 
    // (Using titles as a proxy for "Designations" or similar metric if needed, or Roles)
    const { data: titlesData } = useQuery({
        queryKey: ["titles", "all"],
        queryFn: staffService.getAllTitles,
        staleTime: 30 * 60 * 1000,
    });

    // 3. Fetch Departments Count
    const { data: departmentsData } = useQuery({
        queryKey: ["departments", "all"],
        queryFn: staffService.getAllDepartments,
        staleTime: 30 * 60 * 1000,
    });

    // 4. Fetch Faculties Count
    const { data: facultiesData } = useQuery({
        queryKey: ["faculties", "all"],
        queryFn: staffService.getAllFaculties,
        staleTime: 30 * 60 * 1000,
    });

    const stats = [
        {
            title: "Total Staff",
            value: staffData?.totalElements?.toLocaleString() || "...",
            change: "Active Members",
            changeLabel: "Currently registered",
            icon: Users,
            trend: "", // No trend data for now
            bgGradient: "from-blue-500/20 to-blue-500/5",
            iconBg: "bg-blue-500",
        },
        {
            title: "Designations",
            value: titlesData?.length?.toString() || "...",
            change: "Available Titles",
            changeLabel: "Across all levels",
            icon: BookOpen,
            trend: "",
            bgGradient: "from-amber-500/20 to-amber-500/5",
            iconBg: "bg-amber-500",
        },
        {
            title: "Departments",
            value: departmentsData?.length?.toString() || "...",
            change: "Academic Units",
            changeLabel: "Operational",
            icon: Building2,
            trend: "",
            bgGradient: "from-emerald-500/20 to-emerald-500/5",
            iconBg: "bg-emerald-500",
        },
        {
            title: "Faculties",
            value: facultiesData?.length?.toString() || "...",
            change: "Major Divisions",
            changeLabel: "In the institution",
            icon: GraduationCap,
            trend: "",
            bgGradient: "from-purple-500/20 to-purple-500/5",
            iconBg: "bg-purple-500",
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
            className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        >
            {stats.map((stat, index) => (
                <motion.div key={index} variants={itemVariants}>
                    <StatsCard {...stat} />
                </motion.div>
            ))}
        </motion.div>
    );
};

export default StaffOverviewCards;
