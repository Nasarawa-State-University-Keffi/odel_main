import { Filter, Zap, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FloatingSelect } from "@/components/ui/floating-select";
import { motion, AnimatePresence } from "framer-motion";
import { Session, Semester } from "@/features/admin/types/admission";

interface Faculty {
    id: number;
    name: string;
}

interface ApplicationsFiltersProps {
    sessions: Session[];
    isSessionsLoading: boolean;
    selectedSession: string;
    onSessionChange: (val: string) => void;

    semesters: Semester[];
    isSemestersLoading: boolean;
    selectedSemester: string;
    onSemesterChange: (val: string) => void;

    faculties: Faculty[];
    isFacultiesLoading: boolean;
    selectedFaculty: string;
    onFacultyChange: (val: string) => void;

    activeAdmission: any;
    onResetToActive: () => void;
    onResetFilters: () => void;
}

const ApplicationsFilters = ({
    sessions, isSessionsLoading, selectedSession, onSessionChange,
    semesters, isSemestersLoading, selectedSemester, onSemesterChange,
    faculties, isFacultiesLoading, selectedFaculty, onFacultyChange,
    activeAdmission, onResetToActive, onResetFilters
}: ApplicationsFiltersProps) => {
    return (
        <Card className="shadow-lg border border-white/20 bg-background/40 backdrop-blur-md rounded-[2rem] overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <CardContent className="p-8 relative">
                <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                        <FloatingSelect
                            label="Academic Session"
                            name="session"
                            options={sessions.map(s => ({ value: s.id.toString(), label: s.name }))}
                            value={selectedSession}
                            onChange={(e) => onSessionChange(e.target.value)}
                            isLoading={isSessionsLoading}
                            className="bg-white/5 border-white/10 focus-within:bg-white/10 backdrop-blur-sm rounded-xl h-14"
                        />
                        <FloatingSelect
                            label="Semester"
                            name="semester"
                            options={semesters.map(s => ({ value: s.id.toString(), label: s.title }))}
                            value={selectedSemester}
                            onChange={(e) => onSemesterChange(e.target.value)}
                            isLoading={isSemestersLoading}
                            className="bg-white/5 border-white/10 focus-within:bg-white/10 backdrop-blur-sm rounded-xl h-14"
                        />
                        <FloatingSelect
                            label="Faculty/School"
                            name="faculty"
                            options={faculties.map(f => ({ value: f.id.toString(), label: f.name }))}
                            value={selectedFaculty}
                            onChange={(e) => onFacultyChange(e.target.value)}
                            isLoading={isFacultiesLoading}
                            className="bg-white/5 border-white/10 focus-within:bg-white/10 backdrop-blur-sm rounded-xl h-14"
                        />
                    </div>

                    <div className="flex items-center gap-4 w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-white/10 lg:pl-8 lg:border-l border-white/10">
                        <AnimatePresence>
                            {activeAdmission && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                >
                                    <Badge
                                        variant="outline"
                                        className="h-11 px-6 gap-2.5 bg-primary/10 text-primary border-primary/20 cursor-pointer hover:bg-primary/20 transition-all rounded-xl border-2 group/badge"
                                        onClick={onResetToActive}
                                    >
                                        <Zap className="h-4 w-4 fill-current group-hover/badge:scale-110 transition-transform" />
                                        <div className="flex flex-col items-start leading-none gap-1">
                                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Reset To Active</span>
                                            <span className="text-xs font-bold">{activeAdmission.session?.name}</span>
                                        </div>
                                    </Badge>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={onResetFilters}
                            title="Reset Filters"
                            className="h-11 w-11 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 hover:text-foreground transition-all shadow-sm"
                        >
                            <RefreshCw className="h-5 w-5 text-muted-foreground" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ApplicationsFilters;
