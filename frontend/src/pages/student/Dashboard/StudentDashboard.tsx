import { StudentProfileCard } from "@/features/student/components/dashboard/StudentProfileCard";
import { useApplicationData } from "@/features/student/hooks/useApplicationData";
import WelcomeBanner from "@/features/student/components/dashboard/WelcomeBanner";
import { motion } from "framer-motion";
import { ArrowRight, FileText, CheckCircle, GraduationCap, School, Loader2 } from "lucide-react";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import { Link } from "react-router-dom";

const StudentDashboard = () => {
    const { isLoading, mappedData, appConfig, userData } = useApplicationData();

    const displayName = mappedData?.personal?.firstName || "Applicant";

    const quickActions = [
        {
            title: "Complete Application",
            desc: "Finish your personal and academic record submission.",
            icon: FileText,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            link: "/student/application"
        },
        {
            title: "O'Level Result",
            desc: "Upload and verify your senior secondary school details.",
            icon: GraduationCap,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            link: "/student/application?step=olevel"
        },
        {
            title: "Upload Documents",
            desc: "Submit certificates and identification documents.",
            icon: CheckCircle,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            link: "/student/application?step=documents"
        }
    ];

    return (
        <div className="space-y-10 relative min-h-[500px]">
            {/* Loading Overlay */}
            {isLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-3xl">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading dashboard...</p>
                    </div>
                </div>
            )}



            {/* Profile Card */}
            <StudentProfileCard userData={userData} />



            {/* Quick Actions & More */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-black tracking-tight text-[#01402c] uppercase">Quick Actions</h2>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                        {quickActions.map((action, idx) => (
                            <Link to={action.link} key={idx} className="group">
                                <motion.div
                                    whileHover={{ y: -5 }}
                                    className="h-full bg-white rounded-3xl p-6 border border-border/40 shadow-sm group-hover:shadow-xl transition-all duration-300"
                                >
                                    <div className={`p-4 rounded-2xl ${action.bg} ${action.color} mb-6 w-fit group-hover:scale-110 transition-transform`}>
                                        <action.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="font-black text-lg text-foreground mb-2">{action.title}</h3>
                                    <p className="text-xs font-medium text-muted-foreground leading-relaxed mb-6">{action.desc}</p>
                                    <div className="flex items-center text-xs font-bold text-primary group-hover:gap-2 transition-all">
                                        Get Started <ArrowRight className="h-3 w-3 ml-1" />
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-black tracking-tight text-[#01402c] uppercase">Current Programme</h2>
                    </div>
                    <div className="bg-[#01402c] rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute -right-10 -top-10 opacity-10">
                            <School className="h-40 w-40" />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Registered For</span>
                                <h3 className="text-2xl font-black tracking-tight leading-tight italic">
                                    {appConfig?.name || "B.Sc. Computer Science"}
                                </h3>
                                <p className="text-white/60 text-sm font-medium">{appConfig?.code || "WAITING..."}</p>
                            </div>

                            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest">Type</p>
                                    <p className="text-sm font-black italic">{appConfig?.code ? (appConfig.code.includes('DE') ? 'Direct Entry' : 'Post-UTME') : 'Undergraduate'}</p>
                                </div>
                                <Button className="bg-white text-primary hover:bg-white/90 rounded-2xl px-6 h-10 font-black text-xs">
                                    View Details
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
