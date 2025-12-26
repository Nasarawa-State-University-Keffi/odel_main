import { Users, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

interface ApplicationsStatsProps {
    stats: any;
    isLoadingStats: boolean;
}

const ApplicationsStats = ({ stats, isLoadingStats }: ApplicationsStatsProps) => {
    const statsConfig = [
        { title: "Total Applications", value: stats?.total, label: "Across selected session", icon: Users, color: "text-primary", bg: "bg-primary/10", border: "border-l-primary" },
        { title: "Registered Students", value: stats?.registered, label: "Completed enrollment", icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-l-emerald-500" },
        { title: "Pending Enrollment", value: stats?.unregistered, label: "Awaiting registration", icon: XCircle, color: "text-orange-600", bg: "bg-orange-50", border: "border-l-orange-500" }
    ];

    return (
        <div className="grid gap-6 md:grid-cols-3">
            {statsConfig.map((stat, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                >
                    <Card className={`shadow-md border-0 border-l-4 ${stat.border} hover:shadow-xl transition-all duration-300 group overflow-hidden`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">{stat.title}</CardTitle>
                            <div className={`h-10 w-10 ${stat.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoadingStats ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-9 w-24" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                            ) : (
                                <>
                                    <div className="text-3xl font-black tracking-tight">{stat.value?.toLocaleString() || "0"}</div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-1">
                                        {stat.label}
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
};

export default ApplicationsStats;
