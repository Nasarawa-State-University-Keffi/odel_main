import { useEffect } from "react";
import { useStaffAccessment } from "@/service/useStaffAssessment";
import { Plus, AlertCircle } from "lucide-react";
import { AnimateIn } from "@/components/ui/animate-in";
import { AssignmentEmptyState, AssignmentLoadingState } from "@/components/staff/assignments/AssignmentStates";
import { AssignmentCard } from "@/components/staff/assignments/AssignmentCard.";
import { useNavigate } from "react-router-dom";

const Assignment = () => {
    const { fetchAssignments, isPending, data, error } = useStaffAccessment();
    const navigate = useNavigate();
    

    useEffect(() => {
        fetchAssignments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-heading text-text-main">Assignments</h1>
                    <p className="text-text-muted text-sm mt-1">Manage, create, and grade course assessments.</p>
                </div>

                <button
                    className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto justify-center"
                    onClick={() => navigate("/staff/dashboard/assignments/create")}
                >
                    <Plus size={18} />
                    <span>Create Assignment</span>
                </button>
            </div>

            {/* Error State */}
            {error && !isPending && (
                <AnimateIn direction="down" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8 flex items-start gap-3">
                    <AlertCircle size={20} className="mt-0.5 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </AnimateIn>
            )}

            {/* Loading State */}
            {isPending && !data && <AssignmentLoadingState />}

            {/* Data Render */}
            {!isPending && data && data.results.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {data.results.map((assignment, index) => (
                        <AnimateIn
                            key={assignment.id}
                            direction="up"
                            delay={index * 0.1}
                            className="h-full"
                        >
                            <AssignmentCard assignment={assignment} />
                        </AnimateIn>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!isPending && data && data.results.length === 0 && (
                <AssignmentEmptyState />
            )}
        </main>
    );
};

export default Assignment;