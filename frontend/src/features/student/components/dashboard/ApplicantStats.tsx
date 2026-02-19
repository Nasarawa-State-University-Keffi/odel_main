import { motion } from "framer-motion";
import { User, FileText, CreditCard, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string;
    description: string;
    icon: any;
    status: 'complete' | 'pending' | 'warning' | 'info';
    isLoading?: boolean;
}

const StatCard = ({ title, value, description, icon: Icon, status, isLoading }: StatCardProps) => {
    const statusConfig = {
        complete: {
            bg: "from-emerald-500/20 to-emerald-500/5",
            iconBg: "bg-emerald-500",
            text: "text-emerald-500",
            border: "border-emerald-500/20"
        },
        pending: {
            bg: "from-amber-500/20 to-amber-500/5",
            iconBg: "bg-amber-500",
            text: "text-amber-500",
            border: "border-amber-500/20"
        },
        warning: {
            bg: "from-rose-500/20 to-rose-500/5",
            iconBg: "bg-rose-500",
            text: "text-rose-500",
            border: "border-rose-500/20"
        },
        info: {
            bg: "from-blue-500/20 to-blue-500/5",
            iconBg: "bg-blue-500",
            text: "text-blue-500",
            border: "border-blue-500/20"
        }
    };

    const config = statusConfig[status];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "group relative overflow-hidden rounded-[2rem] bg-background/50 border border-white/10 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1",
                config.border
            )}
        >
            <div className="absolute inset-0 backdrop-blur-md bg-gradient-to-br from-white/5 to-transparent shadow-inner" />
            <div className={cn(
                "absolute top-0 right-0 -mr-16 -mt-16 h-32 w-32 rounded-full blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity duration-500 bg-gradient-to-br",
                config.bg
            )} />

            <div className="relative p-7 flex flex-col justify-between h-full min-h-[180px]">
                <div className="flex items-start justify-between mb-4">
                    <div className={cn(
                        "p-3.5 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10 group-hover:scale-110 transition-transform duration-300 shadow-inner",
                        config.bg
                    )}>
                        <Icon className={cn("h-6 w-6", config.text)} />
                    </div>
                    {!isLoading && (
                        <div className={cn(
                            "flex items-center gap-1.5 px-3 py-1 rounded-full bg-background/40 border border-white/10 backdrop-blur-sm text-[10px] font-black uppercase tracking-widest",
                            config.text
                        )}>
                            {status === 'complete' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                            {status}
                        </div>
                    )}
                </div>

                <div className="space-y-1.5">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">{title}</h3>
                    {isLoading ? (
                        <div className="space-y-2">
                            <div className="h-8 w-3/4 bg-muted/20 rounded-lg animate-pulse" />
                            <div className="h-3 w-1/2 bg-muted/10 rounded animate-pulse" />
                        </div>
                    ) : (
                        <>
                            <div className="text-3xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors">{value}</div>
                            <p className="text-xs font-semibold text-muted-foreground/60 leading-relaxed">{description}</p>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export const ApplicantStats = ({ data, isLoading }: { data: any, isLoading: boolean }) => {
    const isProfileComplete = !!data?.personal?.firstName && !!data?.personal?.lastName && !!data?.personal?.phoneNumber;
    const isSsceUploaded = data?.olevel?.results?.length > 0 && data?.olevel?.results[0]?.examNumber;
    const isPaymentMade = !!data?.applicationFee?.paid;

    const stats = [
        {
            title: "Application Status",
            value: data?.admission?.status || "In Progress",
            description: data?.admission?.comment || "Complete your application to be considered for admission.",
            icon: FileText,
            status: data?.admission?.status === 'ADMITTED' ? 'complete' : 'pending' as any,
        },
        {
            title: "Personal Profile",
            value: isProfileComplete ? "Completed" : "Incomplete",
            description: isProfileComplete ? "Your personal details are up to date." : "Please fill in your personal information details.",
            icon: User,
            status: isProfileComplete ? 'complete' : 'warning' as any,
        },
        {
            title: "Academic Records",
            value: isSsceUploaded ? "Uploaded" : "Pending",
            description: isSsceUploaded ? "O'Level results have been successfully recorded." : "Upload your O-Level results to proceed.",
            icon: CheckCircle2,
            status: isSsceUploaded ? 'complete' : 'pending' as any,
        },
        {
            title: "Payment Status",
            value: isPaymentMade ? "Paid" : "Unpaid",
            description: isPaymentMade ? "Application fee payment confirmed." : "Kindly settle your application fee to finalize submission.",
            icon: CreditCard,
            status: isPaymentMade ? 'complete' : 'rose' as any, // mapping 'rose' to warning if needed
        }
    ];

    return (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
                <StatCard
                    key={index}
                    {...stat}
                    status={stat.status === 'rose' ? 'warning' : stat.status}
                    isLoading={isLoading}
                />
            ))}
        </div>
    );
};
