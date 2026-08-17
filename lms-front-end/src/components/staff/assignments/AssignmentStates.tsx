
import { BookX, Loader2, Plus } from "lucide-react";
import { AnimateIn } from "../../ui/animate-in";
import { useNavigate } from "react-router-dom";

export const AssignmentEmptyState = () => {
    const navigate = useNavigate()
    return (
        <AnimateIn direction="up" className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-20 h-20 bg-primary-50 text-primary-500 rounded-full flex items-center justify-center mb-6">
                <BookX size={40} />
            </div>
            <h3 className="text-xl font-heading text-text-main mb-2">No assignments found</h3>
            <p className="text-text-muted max-w-md mb-8">
                You haven't created any assignments yet. Get started by creating your first assessment.
            </p>
            <button className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm shadow-primary-500/20" onClick={() => navigate("/staff/dashboard/assignments/create")}>
                <Plus size={18} />
                Create First Assignment
            </button>
        </AnimateIn>
    );
};

export const AssignmentLoadingState = () => {
    return (
        <div className="flex flex-col items-center justify-center py-32 text-primary-500">
            <Loader2 size={40} className="animate-spin mb-4" />
            <p className="text-sm font-medium text-text-muted">Loading assignments...</p>
        </div>
    );
};