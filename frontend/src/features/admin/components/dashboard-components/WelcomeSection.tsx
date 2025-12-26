import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";


interface WelcomeSectionProps {
    displayName: string;
    isLoading: boolean;
}





const WelcomeSection = ({ displayName, isLoading }: WelcomeSectionProps) => {

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[2.5rem] bg-background/40 border border-white/20 shadow-2xl backdrop-blur-md p-8 lg:p-12 hover:shadow-primary/5 transition-all duration-500 group"
        >
            {/* Soft Ambient Glow */}
            <div className="absolute top-0 right-0 -mr-40 -mt-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-[120px] opacity-40 group-hover:opacity-60 transition-opacity duration-700" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                <div className="space-y-2 max-w-3xl">
                    {isLoading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-14 w-80 rounded-2xl" />
                            <Skeleton className="h-5 w-40 rounded-lg" />
                        </div>
                    ) : (
                        <>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-foreground">
                                {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">{displayName}</span>.
                            </h1>
                            <p className="text-muted-foreground font-medium text-lg md:text-xl tracking-tight pl-1">
                                Admin Dashboard Overview
                            </p>
                        </>
                    )}
                </div>


            </div>
        </motion.div>
    );
};

export default WelcomeSection;
