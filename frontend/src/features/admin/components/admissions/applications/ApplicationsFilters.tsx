import { Filter, Zap } from "lucide-react";
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
        <Card className="shadow-xl border-0 bg-background/50 backdrop-blur-sm group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="p-6 relative">
                <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                        <FloatingSelect
                            label="Academic Session"
                            name="session"
                            options={sessions.map(s => ({ value: s.id.toString(), label: s.name }))}
                            value={selectedSession}
                            onChange={(e) => onSessionChange(e.target.value)}
                            isLoading={isSessionsLoading}
                            className="bg-background/80"
                        />
                        <FloatingSelect
                            label="Semester"
                            name="semester"
                            options={semesters.map(s => ({ value: s.id.toString(), label: s.title }))}
                            value={selectedSemester}
                            onChange={(e) => onSemesterChange(e.target.value)}
                            isLoading={isSemestersLoading}
                            className="bg-background/80"
                        />
                        <FloatingSelect
                            label="Faculty/School"
                            name="faculty"
                            options={faculties.map(f => ({ value: f.id.toString(), label: f.name }))}
                            value={selectedFaculty}
                            onChange={(e) => onFacultyChange(e.target.value)}
                            isLoading={isFacultiesLoading}
                            className="bg-background/80"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto pt-2 lg:pt-0">
                        <AnimatePresence>
                            {activeAdmission && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                >
                                    <Badge
                                        variant="outline"
                                        className="px-4 py-2 gap-2 bg-primary/10 text-primary border-primary/20 cursor-pointer hover:bg-primary/20 transition-all rounded-xl border-2"
                                        onClick={onResetToActive}
                                    >
                                        <Zap className="h-3.5 w-3.5 fill-current" />
                                        <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                                            Active: {activeAdmission.session?.name}
                                        </span>
                                    </Badge>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={onResetFilters}
                            title="Reset Filters"
                            className="h-11 w-11 rounded-xl bg-background shadow-sm hover:bg-primary/5 hover:text-primary transition-all border-border/50"
                        >
                            <Filter className="h-5 w-5 text-muted-foreground" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ApplicationsFilters;
