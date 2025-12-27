import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface ApplicationsHeaderProps {
    onOpenCreateModal: () => void;
    onEnableAdmission: () => void;
    isEnableLoading?: boolean;
}

const ApplicationsHeader = ({ onOpenCreateModal, onEnableAdmission, isEnableLoading }: ApplicationsHeaderProps) => {
    const { isAdmin } = useAuth();
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
            >
                <h1 className="text-3xl font-black tracking-tighter text-[#01402c]">Admission Management</h1>
                <p className="text-muted-foreground mt-1 font-medium">Manage sessions, monitor applications, and enrollment health.</p>
            </motion.div>
            {!isAdmin && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3"
                >
                    <Button
                        onClick={onEnableAdmission}
                        disabled={isEnableLoading}
                        variant="secondary"
                        className="gap-2 h-11 px-6 rounded-xl font-bold transition-all hover:bg-secondary/80"
                    >
                        {isEnableLoading ? "Enabling..." : "Enable Admission"}
                    </Button>

                    <Button onClick={onOpenCreateModal} className="gap-2 shadow-lg shadow-primary/20 h-11 px-6 rounded-xl font-bold transition-all hover:scale-105 active:scale-95">
                        <Plus className="h-5 w-5" />
                        Create New Admission
                    </Button>
                </motion.div>
            )}
        </div>
    );
};

export default ApplicationsHeader;
