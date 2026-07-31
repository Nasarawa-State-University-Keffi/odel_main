export const AssignmentDetailSkeleton = () => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
            <div className="lg:col-span-2 space-y-6">
                <div className="h-12 w-3/4 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="h-6 w-1/3 rounded-lg bg-slate-200 dark:bg-slate-800" />
                
                <div className="h-48 w-full rounded-3xl bg-slate-200 dark:bg-slate-800" />
                
                <div className="space-y-4">
                    <div className="h-8 w-1/4 rounded-lg bg-slate-200 dark:bg-slate-800" />
                    <div className="h-20 w-full rounded-2xl bg-slate-200 dark:bg-slate-800" />
                </div>
            </div>

            {/* Sidebar Skeleton */}
            <div className="space-y-6">
                <div className="h-85 w-full rounded-3xl bg-slate-200 dark:bg-slate-800" />
                <div className="h-14 w-full rounded-2xl bg-slate-200 dark:bg-slate-800" />
            </div>
        </div>
    );
};