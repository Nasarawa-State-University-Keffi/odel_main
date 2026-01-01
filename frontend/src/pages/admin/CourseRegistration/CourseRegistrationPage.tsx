import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, CheckCircle2, History, ClipboardList, PenTool } from "lucide-react";
import PendingApprovals from "@/features/admin/components/courseRegistration/PendingApprovals";
import ApprovedList from "@/features/admin/components/courseRegistration/ApprovedList";
import ManualRegistration from "@/features/admin/components/courseRegistration/ManualRegistration";
import { useAuth } from "@/contexts/AuthContext";

const CourseRegistrationPage = () => {
    const { hasRole } = useAuth();
    const isStudent = hasRole("STUDENT");

    return (
        <div className="p-8 space-y-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl md:text-3xl font-black tracking-tight text-[#01402c]">
                    COURSE REGISTRATION <span className="text-primary">MANAGEMENT</span>
                </h1>
                <p className="text-muted-foreground font-medium text-lg">Manage student course registrations and approvals.</p>
            </div>

            <Tabs defaultValue={isStudent ? "manual" : "pending"} className="space-y-8">
                <div className="bg-slate-100/50 p-1.5 rounded-2xl inline-flex">
                    <TabsList className="bg-transparent h-auto p-0 gap-2">
                        {!isStudent && (
                            <>
                                <TabsTrigger
                                    value="pending"
                                    className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-6 py-3 rounded-xl gap-2 font-bold transition-all"
                                >
                                    <ClipboardList className="w-4 h-4" />
                                    Pending Approvals
                                </TabsTrigger>
                                <TabsTrigger
                                    value="approved"
                                    className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm px-6 py-3 rounded-xl gap-2 font-bold transition-all"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Approved Courses
                                </TabsTrigger>
                            </>
                        )}
                        {isStudent && (
                            <TabsTrigger
                                value="manual"
                                className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm px-6 py-3 rounded-xl gap-2 font-bold transition-all"
                            >
                                <PenTool className="w-4 h-4" />
                                Manual Registration
                            </TabsTrigger>
                        )}
                    </TabsList>
                </div>

                {!isStudent && (
                    <>
                        <TabsContent value="pending" className="animate-in slide-in-from-bottom-4 duration-500 focus-visible:outline-none">
                            <PendingApprovals />
                        </TabsContent>

                        <TabsContent value="approved" className="animate-in slide-in-from-bottom-4 duration-500 focus-visible:outline-none">
                            <ApprovedList />
                        </TabsContent>
                    </>
                )}

                {isStudent && (
                    <TabsContent value="manual" className="animate-in slide-in-from-bottom-4 duration-500 focus-visible:outline-none">
                        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-8">
                            <ManualRegistration />
                        </div>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
};

export default CourseRegistrationPage;
