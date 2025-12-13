import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar, BarChart3 } from "lucide-react";
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

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 rounded-2xl p-6 md:p-8 text-primary-foreground shadow-lg"
        >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    {isLoading ? (
                        <>
                            <Skeleton className="h-8 w-64 mb-2 bg-primary-foreground/20" />
                            <Skeleton className="h-5 w-80 bg-primary-foreground/20" />
                        </>
                    ) : (
                        <>
                            <h1 className="text-2xl md:text-3xl font-bold mb-2">
                                {getGreeting()}, {displayName}
                            </h1>
                            <p className="text-primary-foreground/90 text-sm md:text-base">
                                Here's what's happening with your institution today
                            </p>
                        </>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" className="gap-2">
                        <Calendar className="h-4 w-4" />
                        Today: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Button>
                </div>
            </div>
        </motion.div>
    );
};

export default WelcomeSection;
