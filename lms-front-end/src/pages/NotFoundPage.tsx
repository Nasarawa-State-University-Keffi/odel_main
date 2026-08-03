import { AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const NotFoundPage = () => (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-950 px-4 text-center">
        <div className="max-w-md space-y-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">
                <AlertCircle className="h-8 w-8" />
            </div>
            <div className="space-y-2">
                <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-slate-50">Page Not Found</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    The requested route or portal endpoint does not exist, or you lack access authorization.
                </p>
            </div>
            <Link
                to="/dashboard"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 transition-all"
            >
                <ArrowLeft className="h-4 w-4" />
                <span>Return to Central Dashboard</span>
            </Link>
        </div>
    </div>
);


export default NotFoundPage;