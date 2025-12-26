import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface StaffHeaderProps {
    onAddStaff?: () => void;
}

const StaffHeader = ({ onAddStaff }: StaffHeaderProps) => {
    return (
        <div className="flex items-center justify-between flex-none">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
            >
                <h1 className="text-3xl font-black tracking-tighter text-[#01402c]">
                    Staff Management
                </h1>
                <p className="text-muted-foreground mt-1 font-medium">
                    Manage ODEL staff members, roles, and administrative permissions.
                </p>
            </motion.div>
            {onAddStaff && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <Button onClick={onAddStaff} className="gap-2 shadow-lg shadow-primary/20 h-11 px-6 rounded-xl font-bold transition-all hover:scale-105 active:scale-95">
                        <Plus className="h-5 w-5" />
                        Add New Staff
                    </Button>
                </motion.div>
            )}
        </div>
    );
};

export default StaffHeader;
