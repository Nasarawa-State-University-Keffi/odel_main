import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Save,
    Trash2,
    AlertCircle,
    CheckCircle2,
    Mail,
    Cloud,
    ShieldCheck,
    Send,
    Loader2,
    Code2,
    Clock,
    Key,
    AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { useNotificationSettingDetail } from "@/service/useNotificationSettingDetail";

const BACKEND_OPTIONS = [
    { id: "smtp", name: "Standard SMTP", icon: Mail, description: "Custom SMTP server integration." },
    { id: "sendgrid", name: "SendGrid", icon: Send, description: "Twilio SendGrid API delivery engine." },
    { id: "ses", name: "Amazon SES", icon: Cloud, description: "AWS Simple Email Service protocol." },
    { id: "mailgun", name: "Mailgun", icon: ShieldCheck, description: "Transactional email API service." }
];

const AdminNotificationSettingDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const {
        setting,
        isLoading,
        error: fetchError,
        updateSetting,
        deleteSetting,
        isUpdating,
        isDeleting,
        actionError,
        actionSuccess,
    } = useNotificationSettingDetail(id);

    // Form Local State
    const [backendChoice, setBackendChoice] = useState<string>("smtp");
    const [isActive, setIsActive] = useState<boolean>(true);
    const [configText, setConfigText] = useState<string>("{}");
    const [jsonError, setJsonError] = useState<string | null>(null);

    // Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

    // Populate form state when detail data is loaded
    useEffect(() => {
        if (setting) {
            setBackendChoice(setting.backend_choice);
            setIsActive(setting.is_active);
            setConfigText(
                typeof setting.config === "object"
                    ? JSON.stringify(setting.config, null, 2)
                    : setting.config || "{}"
            );
        }
    }, [setting]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setJsonError(null);

        let parsedConfig: Record<string, any> = {};

        if (configText && configText.trim() !== "") {
            try {
                parsedConfig = JSON.parse(configText);
            } catch (err) {
                setJsonError("Invalid JSON syntax in the Configuration field. Please verify formatting.");
                return;
            }
        }

        await updateSetting({
            backend_choice: backendChoice,
            is_active: isActive,
            config: parsedConfig
        }).then(() => {
            navigate("/admin/dashboard/notifications/settings");
        });
    };

    const handleDelete = async () => {
        const success = await deleteSetting();
        if (success) {
            setIsDeleteModalOpen(false);
            navigate("/admin/dashboard/notifications/settings");
        }
    };

    if (isLoading) {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl">
                    <div className="flex flex-col items-center justify-center min-h-100">
                        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading email configuration...</p>
                    </div>
                </div>
            </main>
        );
    }

    if (fetchError || !setting) {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl text-center">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                        <AlertCircle className="h-6 w-6" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Configuration Not Found</h2>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{fetchError || "The requested notification setting could not be retrieved."}</p>
                    <button
                        onClick={() => navigate("/admin/dashboard/notifications/settings")}
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-indigo-700"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to Settings
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="relative min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">

                {/* Header Section */}
                <div className="mb-8 border-b border-slate-200 pb-6 dark:border-slate-800">
                    <button
                        onClick={() => navigate("/admin/dashboard/notifications/settings")}
                        className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to Notification Settings
                    </button>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white uppercase">
                                    {setting.backend_choice}
                                </h1>
                                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-semibold border ${setting.is_active
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                    }`}>
                                    {setting.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1">
                                    <Key className="h-3.5 w-3.5" /> ID: <code className="font-mono">{setting.id}</code>
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" /> Updated: {format(new Date(setting.updated_at), "MMM d, yyyy • HH:mm")}
                                </span>
                            </div>
                        </div>

                        {/* Danger Action */}
                        <button
                            type="button"
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/50"
                        >
                            <Trash2 className="h-4 w-4" /> Delete Provider
                        </button>
                    </div>
                </div>

                {/* Status Messages */}
                {(actionError || jsonError) && (
                    <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 animate-in fade-in">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <p className="text-sm font-semibold">{jsonError || actionError}</p>
                    </div>
                )}

                {actionSuccess && (
                    <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400 animate-in fade-in">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        <p className="text-sm font-semibold">{actionSuccess}</p>
                    </div>
                )}

                {/* Edit Form */}
                <form onSubmit={handleUpdate} className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="p-6 sm:p-8 space-y-8">

                        {/* Provider Selection */}
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-slate-900 dark:text-white">
                                Backend Provider
                            </label>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {BACKEND_OPTIONS.map((option) => {
                                    const isSelected = backendChoice === option.id;
                                    const Icon = option.icon;
                                    return (
                                        <div
                                            key={option.id}
                                            onClick={() => setBackendChoice(option.id)}
                                            className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${isSelected
                                                ? "border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-500/10"
                                                : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                                                }`}
                                        >
                                            <div className="mb-3 flex items-center justify-between">
                                                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isSelected
                                                    ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400'
                                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}>
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-indigo-600 dark:border-indigo-400' : 'border-slate-300 dark:border-slate-600'
                                                    }`}>
                                                    {isSelected && <div className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />}
                                                </div>
                                            </div>
                                            <h3 className={`font-semibold ${isSelected ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-900 dark:text-white'}`}>
                                                {option.name}
                                            </h3>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                {option.description}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <hr className="border-slate-200 dark:border-slate-800" />

                        {/* Configuration JSON Editor */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                                    <Code2 className="h-4 w-4 text-slate-500" /> Configuration Payload
                                </label>
                                <span className="text-xs text-slate-400">JSON Object</span>
                            </div>
                            <textarea
                                rows={8}
                                value={configText}
                                onChange={(e) => setConfigText(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-900 p-4 font-mono text-xs text-emerald-400 outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950"
                            />
                        </div>

                        <hr className="border-slate-200 dark:border-slate-800" />

                        {/* Active Switch */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="block text-sm font-bold text-slate-900 dark:text-white">
                                    Active Status
                                </label>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Enable or disable this email provider across the platform.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsActive(!isActive)}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${isActive ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                                    }`}
                                role="switch"
                                aria-checked={isActive}
                            >
                                <span className="sr-only">Toggle active status</span>
                                <span
                                    aria-hidden="true"
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isActive ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Footer Controls */}
                    <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/50 rounded-b-2xl">
                        <button
                            type="button"
                            onClick={() => navigate("/admin/dashboard/notifications/settings")}
                            className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isUpdating}
                            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isUpdating ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" /> Saving Changes...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" /> Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* --- Delete Confirmation Modal --- */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 animate-in zoom-in-95">
                        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                            <AlertTriangle className="h-7 w-7 text-red-600 dark:text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Delete Notification Provider?</h3>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Are you sure you want to delete the <span className="font-bold uppercase text-slate-900 dark:text-white">{setting.backend_choice}</span> configuration? System emails using this provider will fail until reconfigured.
                        </p>
                        <div className="mt-8 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                disabled={isDeleting}
                                className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 focus:ring-4 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" /> Deleting...
                                    </>
                                ) : (
                                    "Yes, Delete Provider"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};


export default AdminNotificationSettingDetailPage;