
import { AnimateIn } from "@/components/ui/animate-in";
import { Inbox, Loader2 } from "lucide-react";

export const SubmissionEmptyState = ({ hasSearch }: { hasSearch?: boolean }) => {
    return (
        <AnimateIn direction="up" className="flex flex-col items-center justify-center py-20 px-4 text-center bg-surface border border-border-subtle rounded-xl shadow-sm">
            <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4">
                <Inbox size={32} />
            </div>
            <h3 className="text-lg font-heading text-text-main mb-2">
                {hasSearch ? "No matching submissions" : "No submissions yet"}
            </h3>
            <p className="text-text-muted max-w-sm mb-6 text-sm">
                {hasSearch
                    ? "Try adjusting your search terms or clearing the filter."
                    : "Students have not submitted any assignments yet. Check back later."}
            </p>
        </AnimateIn>
    );
};

export const SubmissionLoadingState = () => {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-primary-500 bg-surface border border-border-subtle rounded-xl shadow-sm">
            <Loader2 size={32} className="animate-spin mb-4" />
            <p className="text-sm font-medium text-text-muted">Loading submissions...</p>
        </div>
    );
};