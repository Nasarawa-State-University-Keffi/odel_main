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
    const { hasAnyRole } = useAuth();

    // Actions hidden for ADMIN and SUPER_ADMIN
    const canManageAdmission = !hasAnyRole(['ADMIN', 'SUPER_ADMIN']);

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-1"
            >
                <h1 className="text-3xl md:text-3xl font-black tracking-tight text-[#01402c]">
                    ADMISSION <span className="text-primary">MANAGEMENT</span>
                </h1>
                <p className="text-sm font-medium text-muted-foreground max-w-lg">
                    Manage academic sessions, monitor application inflow, and oversee enrollment health.
                </p>
            </motion.div>

            {canManageAdmission && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-4"
                >
                    <Button
                        onClick={onEnableAdmission}
                        disabled={isEnableLoading}
                        variant="secondary"
                        className="gap-2 h-12 px-6 rounded-xl font-bold transition-all hover:bg-secondary/80 text-xs uppercase tracking-wider shadow-sm border border-secondary"
                    >
                        {isEnableLoading ? "Enabling..." : "Enable Admission"}
                    </Button>

                    <Button
                        onClick={onOpenCreateModal}
                        className="gap-2 shadow-lg shadow-primary/25 h-12 px-6 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 text-xs uppercase tracking-wider bg-gradient-to-r from-primary to-primary/90"
                    >
                        <Plus className="h-4 w-4" />
                        Create Admission
                    </Button>
                </motion.div>
            )}
        </div>
    );
};

export default ApplicationsHeader;
