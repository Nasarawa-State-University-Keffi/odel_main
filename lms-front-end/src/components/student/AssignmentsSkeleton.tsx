// components/assignments/AssignmentsSkeleton.tsx
export const AssignmentsSkeleton = () => {
    return (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
                <div
                    key={item}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm animate-pulse space-y-4"
                >
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="h-5 w-20 rounded-md bg-slate-200 dark:bg-slate-800" />
                            <div className="h-5 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
                        </div>
                        <div className="h-6 w-3/4 rounded-md bg-slate-200 dark:bg-slate-800" />
                        <div className="h-4 w-full rounded-md bg-slate-100 dark:bg-slate-800/60" />
                        <div className="h-4 w-2/3 rounded-md bg-slate-100 dark:bg-slate-800/60" />
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="h-4 w-28 rounded-md bg-slate-200 dark:bg-slate-800" />
                            <div className="h-4 w-16 rounded-md bg-slate-200 dark:bg-slate-800" />
                        </div>
                        <div className="h-10 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
                    </div>
                </div>
            ))}
        </div>
    );
};