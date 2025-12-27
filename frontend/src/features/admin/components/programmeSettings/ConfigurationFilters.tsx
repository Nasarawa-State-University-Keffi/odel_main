import { Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ConfigurationFiltersProps {
    selectedProgramme: string;
    setSelectedProgramme: (value: string) => void;
    selectedLevel: string;
    setSelectedLevel: (value: string) => void;
    selectedSemester: string;
    setSelectedSemester: (value: string) => void;
    programmes: any[] | undefined;
    levels: any[] | undefined;
    semesters: any[] | undefined;
    showAvailableCourses: boolean;
    setShowAvailableCourses: (value: boolean) => void;
}

const ConfigurationFilters = ({
    selectedProgramme,
    setSelectedProgramme,
    selectedLevel,
    setSelectedLevel,
    selectedSemester,
    setSelectedSemester,
    programmes,
    levels,
    semesters,
    showAvailableCourses,
    setShowAvailableCourses
}: ConfigurationFiltersProps) => {
    return (
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-md rounded-3xl border-t-4 border-t-primary">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary">
                        <Filter className="h-5 w-5" />
                        <CardTitle className="text-lg font-bold">Configuration Filters</CardTitle>
                    </div>
                    {/* Available Courses Toggle */}
                    <div className="flex items-center gap-2 bg-slate-100/50 p-1.5 rounded-xl border border-slate-200/50">
                        <button
                            onClick={() => setShowAvailableCourses(false)}
                            className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${!showAvailableCourses ? 'bg-white shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            SETTINGS
                        </button>
                        <button
                            onClick={() => setShowAvailableCourses(true)}
                            className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${showAvailableCourses ? 'bg-amber-500 shadow-sm text-white' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            AVAILABLE
                        </button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Programme</label>
                        <Select value={selectedProgramme} onValueChange={setSelectedProgramme}>
                            <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-primary/20 transition-all font-semibold">
                                <SelectValue placeholder="Select Programme" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                {programmes?.map(p => (
                                    <SelectItem key={p.id} value={p.id.toString()} className="font-semibold text-sm py-3">
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Level</label>
                        <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                            <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-primary/20 transition-all font-semibold">
                                <SelectValue placeholder="Select Level" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                {levels?.map(l => (
                                    <SelectItem key={l.id} value={l.id.toString()} className="font-semibold text-sm py-3">
                                        {l.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Semester</label>
                        <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                            <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-primary/20 transition-all font-semibold">
                                <SelectValue placeholder="Select Semester" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                {semesters?.map(s => (
                                    <SelectItem key={s.id} value={s.id.toString()} className="font-semibold text-sm py-3">
                                        {s.title || s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ConfigurationFilters;
