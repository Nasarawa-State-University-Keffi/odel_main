import { motion } from "framer-motion";
import StatsCard from "./StatsCard";
import { Users, Clock, CheckCircle, TrendingUp } from "lucide-react";

const StatsGrid = () => {
    const stats = [
        {
            title: "Total Students",
            value: "2,543",
            change: "+12.5%",
            changeLabel: "vs last month",
            icon: Users,
            trend: "up",
            bgGradient: "from-primary/20 to-primary/5",
            iconBg: "bg-primary",
        },
        {
            title: "Pending Review",
            value: "145",
            change: "+5.2%",
            changeLabel: "this week",
            icon: Clock,
            trend: "up",
            bgGradient: "from-secondary/20 to-secondary/5",
            iconBg: "bg-secondary",
        },
        {
            title: "Approved Today",
            value: "32",
            change: "+18%",
            changeLabel: "vs yesterday",
            icon: CheckCircle,
            trend: "up",
            bgGradient: "from-accent/20 to-accent/5",
            iconBg: "bg-accent",
        },
        {
            title: "Completion Rate",
            value: "94.2%",
            change: "+2.1%",
            changeLabel: "this semester",
            icon: TrendingUp,
            trend: "up",
            bgGradient: "from-primary/20 to-primary/5",
            iconBg: "bg-primary",
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

export default StatsGrid;
