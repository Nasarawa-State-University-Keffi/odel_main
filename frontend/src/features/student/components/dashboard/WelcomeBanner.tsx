import { motion } from "framer-motion";
import { Skeleton } from "@/features/admin/components/admission/components/ui/skeleton";

interface WelcomeBannerProps {
    displayName: string;
    isLoading: boolean;
}

const WelcomeBanner = ({ displayName, isLoading }: WelcomeBannerProps) => {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#01402c] to-[#013020] p-8 lg:p-12 shadow-2xl group border border-white/5"
        >
            {/* Ambient Effects */}
            <div className="absolute top-0 right-0 -mr-40 -mt-40 h-[400px] w-[400px] rounded-full bg-white/5 blur-[100px] opacity-40 group-hover:opacity-60 transition-opacity duration-700" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-primary/10 blur-[80px]" />

            <div className="relative z-10 space-y-2">
                {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-3/4 bg-white/10 rounded-2xl" />
                        <Skeleton className="h-4 w-1/2 bg-white/5 rounded-xl" />
                    </div>
                ) : (
                    <>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white">
                            {getGreeting()}, <span className="text-primary italic animate-pulse">{displayName}!</span>
                        </h1>
                    </>
                )}
            </div>
        </motion.div>
    );
};

export default WelcomeBanner;
