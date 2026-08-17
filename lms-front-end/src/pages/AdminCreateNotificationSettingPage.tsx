// src/pages/AdminCreateNotificationSettingPage.tsx
import React, { useState } from "react";
import {
    ArrowLeft,
    Save,
    AlertCircle,
    CheckCircle2,
    Mail,
    Cloud,
    ShieldCheck,
    Send,
    Loader2,
    Code2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCreateNotificationSetting } from "@/service/useCreateNotificationSetting";

const BACKEND_OPTIONS = [
    {
        id: "smtp",
        name: "Standard SMTP",
        icon: Mail,
        description: "Custom SMTP server integration.",
        template: JSON.stringify({ host: "smtp.mailtrap.io", port: 2525, username: "", password: "", use_tls: true }, null, 2)
    },
    {
        id: "sendgrid",
        name: "SendGrid",
        icon: Send,
        description: "Twilio SendGrid API delivery engine.",
        template: JSON.stringify({ api_key: "SG.your_api_key_here", default_from_email: "noreply@example.com" }, null, 2)
    },
    {
        id: "ses",
        name: "Amazon SES",
        icon: Cloud,
        description: "AWS Simple Email Service protocol.",
        template: JSON.stringify({ aws_access_key_id: "", aws_secret_access_key: "", aws_region: "us-east-1" }, null, 2)
    },
    {
        id: "mailgun",
        name: "Mailgun",
        icon: ShieldCheck,
        description: "Transactional email API service.",
        template: JSON.stringify({ domain: "mg.example.com", api_key: "key-yourkeyhere" }, null, 2)
    }
];
const AdminCreateNotificationSettingPage: React.FC = () => {
    const navigate = useNavigate();
    const { createSetting, isSubmitting, error, success } = useCreateNotificationSetting();

    // Form State
    const [backendChoice, setBackendChoice] = useState<string>("smtp");
    const [isActive, setIsActive] = useState<boolean>(true);
    const [config, setConfig] = useState<string>(BACKEND_OPTIONS[0].template);
    const [jsonError, setJsonError] = useState<string | null>(null);

    const handleSelectBackend = (option: typeof BACKEND_OPTIONS[number]) => {
        setBackendChoice(option.id);
        setConfig(option.template);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setJsonError(null);

        let parsedConfig: Record<string, any> = {};
        if (config && config.trim() !== "") {
            try {
                parsedConfig = JSON.parse(config);
            } catch (err) {
                setJsonError("Invalid JSON syntax in the Configuration field. Please check for missing quotes or commas.");
                return;
            }
        }

        // 2. Submit payload with parsed object
        const result = await createSetting({
            backend_choice: backendChoice,
            is_active: isActive,
            config: parsedConfig
        });

        if (result) {
            setTimeout(() => {
                navigate("/admin/dashboard/notifications/settings");
            }, 1200);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">

                {/* Header & Navigation */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to Notification Settings
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Configure Email Provider
                        </h1>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Set up email backends and security configurations for outbound system emails.
                        </p>
                    </div>
                </div>

                {/* Notifications */}
                {(error || jsonError) && (
                    <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <p className="text-sm font-semibold">{jsonError || error}</p>
                    </div>
                )}

                {success && (
                    <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400 animate-in fade-in slide-in-from-top-2">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        <p className="text-sm font-semibold">Notification setting created successfully! Redirecting...</p>
                    </div>
                )}

                {/* Main Form */}
                <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="p-6 sm:p-8 space-y-8">

                        {/* Provider Selection */}
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-slate-900 dark:text-white">
                                Select Provider Type
                            </label>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {BACKEND_OPTIONS.map((option) => {
                                    const isSelected = backendChoice === option.id;
                                    const Icon = option.icon;
                                    return (
                                        <div
                                            key={option.id}
                                            onClick={() => handleSelectBackend(option)}
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

                        {/* Configuration Field */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                                    <Code2 className="h-4 w-4 text-slate-500" /> JSON Configuration
                                </label>
                                <span className="text-xs text-slate-400">JSON or raw string payload</span>
                            </div>
                            <textarea
                                rows={6}
                                value={config}
                                onChange={(e) => setConfig(e.target.value)}
                                placeholder="Enter provider parameters..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-900 p-4 font-mono text-xs text-emerald-400 outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950"
                            />
                        </div>

                        <hr className="border-slate-200 dark:border-slate-800" />

                        {/* Active Switch */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="block text-sm font-bold text-slate-900 dark:text-white">
                                    Active Backend
                                </label>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Set this provider as active for system emails.
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
                                <span className="sr-only">Toggle notification provider active status</span>
                                <span
                                    aria-hidden="true"
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isActive ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/50 rounded-b-2xl">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" /> Save Provider
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
};


export default AdminCreateNotificationSettingPage