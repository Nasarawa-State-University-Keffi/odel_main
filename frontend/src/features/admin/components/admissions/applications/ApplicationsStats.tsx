import { Users, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";

interface ApplicationsStatsProps {
    stats: any;
    isLoadingStats: boolean;
}

const ApplicationsStats = ({ stats, isLoadingStats }: ApplicationsStatsProps) => {
    const statsConfig = [
        {
            title: "TOTAL APPLICATIONS",
            value: stats?.total,
            label: "Across selected session",
            icon: Users,
            bgGradient: "from-accent/20 to-accent/5",
            iconBg: "bg-accent",
            textColor: "text-accent",
            borderColor: "border-accent/20"
        },
        {
            title: "REGISTERED STUDENTS",
            value: stats?.registered,
            label: "Completed enrollment",
            icon: CheckCircle,
            bgGradient: "from-primary/20 to-primary/5",
            iconBg: "bg-primary",
            textColor: "text-primary",
            borderColor: "border-primary/20"
        },
        {
            title: "PENDING ENROLLMENT",
            value: stats?.unregistered,
            label: "Awaiting registration",
            icon: XCircle,
            bgGradient: "from-secondary/20 to-secondary/5",
            iconBg: "bg-secondary",
            textColor: "text-secondary",
            borderColor: "border-secondary/20"
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-6 md:grid-cols-3"
        >
            {statsConfig.map((stat, i) => (
                <motion.div
                    key={i}
                    variants={itemVariants}
                    className={`group relative overflow-hidden rounded-[2rem] bg-background/40 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1 ${stat.borderColor}`}
                >
                    {/* Glass Effect & Gradient */}
                    <div className="absolute inset-0 backdrop-blur-md bg-gradient-to-br from-white/5 to-transparent opacity-100 transition-opacity duration-300" />
                    <div className={`absolute top-0 right-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-gradient-to-br ${stat.bgGradient} blur-[50px] opacity-40 group-hover:opacity-60 transition-opacity duration-500`} />

                    <div className="relative p-6 flex flex-col justify-between h-full">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3.5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                                <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
                            </div>
                            {/* Animated Pulse for "Live" feel */}
                            {!isLoadingStats && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/40 border border-white/10 backdrop-blur-sm">
                                    <div className={`h-1.5 w-1.5 rounded-full ${stat.iconBg} animate-pulse`} />
                                </div>
                            )}
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{stat.title}</h3>
                            {isLoadingStats ? (
                                <div className="space-y-2 mt-2">
                                    <div className="h-8 w-24 bg-muted/50 rounded-lg animate-pulse" />
                                    <div className="h-3 w-32 bg-muted/30 rounded animate-pulse" />
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-4xl font-bold tracking-tight ${stat.textColor}`}>
                                            {stat.value?.toLocaleString() || "0"}
                                        </span>
                                    </div>
                                    <p className="text-xs font-medium text-muted-foreground/80 pl-0.5">{stat.label}</p>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
};

export default ApplicationsStats;
