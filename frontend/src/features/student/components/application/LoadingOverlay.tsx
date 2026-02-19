import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
    isVisible: boolean;
    title?: string;
    description?: string;
}

export const LoadingOverlay = ({
    isVisible,
    title = "Processing",
    description = "Proceeding to the next step..."
}: LoadingOverlayProps) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[6px] transition-all"
                >
                    <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-card border border-border shadow-2xl scale-110">
                        <div className="relative">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <div className="absolute inset-0 blur-lg bg-primary/20 animate-pulse rounded-full" />
                        </div>
                        <div className="space-y-1 text-center">
                            <h3 className="font-bold text-lg tracking-tight">{title}</h3>
                            <p className="text-xs text-muted-foreground animate-pulse">{description}</p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
