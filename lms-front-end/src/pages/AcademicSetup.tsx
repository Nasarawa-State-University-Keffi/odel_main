import { BookOpen, CalendarDays, GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import EntityManagementView from "./EntityManagementView";
import { useAcademicSetup } from "@/service/useAcademicSetup";

export default function AcademicSetup() {
    const [activeTab, setActiveTab] = useState<'semesters' | 'sessions'>('semesters');
    const academicApi = useAcademicSetup(activeTab);
    const { fetchSemester, semester, setSemester, session, setSession, fetchSession, isPending } = academicApi;


    useEffect(() => {
        (async () => {
            await fetchSemester();
            await fetchSession();
        })()
    }, [activeTab])


    return (
        <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900">

            {/* Top Navigation */}
            {/* <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-600 p-2 rounded-xl">
                                <GraduationCap className="text-white" size={24} />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-indigo-600 to-violet-600">
                                Academic Admin
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center border-2 border-white shadow-sm">
                                <span className="text-sm font-medium text-slate-600">A</span>
                            </div>
                        </div>
                    </div>
                </div>
            </nav> */}

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">System Configuration</h1>
                    <p className="text-slate-500 mt-2 text-lg">Manage academic periods for the institution.</p>
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-2 p-1 bg-slate-200/50 rounded-xl mb-8 w-max">
                    <button
                        onClick={() => setActiveTab('semesters')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${activeTab === 'semesters'
                            ? 'bg-white text-indigo-700 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                            }`}
                    >
                        <BookOpen size={18} />
                        Semesters
                    </button>
                    <button
                        onClick={() => setActiveTab('sessions')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${activeTab === 'sessions'
                            ? 'bg-white text-indigo-700 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                            }`}
                    >
                        <CalendarDays size={18} />
                        Sessions
                    </button>
                </div>

                {/* Active View Container */}
                <div className="pb-12">
                    {activeTab === 'semesters' ? (
                        <EntityManagementView
                            title="Semesters Management"
                            description="Configure the active semesters available for student enrollment."
                            entityName="Semester"
                            icon={BookOpen}
                            api={{
                                createItem: academicApi.createItem,
                                updateItem: academicApi.updateItem,
                                deleteItem: academicApi.deleteItem,
                                isPending: academicApi.isPending
                            }}
                            data={semester}
                            setData={setSemester}
                        />
                    ) : (
                        <EntityManagementView
                            title="Sessions Management"
                            description="Define academic years (e.g., 2023/2024) used across the system."
                            entityName="Session"
                            icon={CalendarDays}
                            api={{
                                createItem: academicApi.createItem,
                                updateItem: academicApi.updateItem,
                                deleteItem: academicApi.deleteItem,
                                isPending: academicApi.isPending
                            }}
                            data={session}
                            setData={setSession}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}

// (
//     <EntityManagementView
//         title="Sessions Management"
//         description="Define academic years (e.g., 2023/2024) used across the system."
//         entityName="Session"
//         icon={CalendarDays}
//         api={sessionsApi}
//     />
// )