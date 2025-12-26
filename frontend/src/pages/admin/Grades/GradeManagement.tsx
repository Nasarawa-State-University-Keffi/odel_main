import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, Filter, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { staffService } from "@/features/admin/services/staffService";
import { gradeService } from "@/features/admin/services/gradeService";
import GradeList from "@/features/admin/components/grades/GradeList";
import CreateGradeModal from "@/features/admin/components/grades/CreateGradeModal";

const GradeManagement = () => {
    const [selectedProgrammeType, setSelectedProgrammeType] = useState<string>("");

    // Fetch Programme Types
    const { data: programmeTypes, isLoading: isLoadingTypes } = useQuery({
        queryKey: ["programme-types"],
        queryFn: staffService.getAllProgrammeTypes,
    });

    // Default select ODEL programme type on load
    useMemo(() => {
        if (programmeTypes && programmeTypes.length > 0 && !selectedProgrammeType) {
            const odelType = programmeTypes.find(type =>
                type.name.toLowerCase().includes("odel") ||
                type.name.toLowerCase().includes("open distance")
            );

            if (odelType) {
                setSelectedProgrammeType(odelType.id.toString());
            } else {
                setSelectedProgrammeType(programmeTypes[0].id.toString());
            }
        }
    }, [programmeTypes, selectedProgrammeType]);

    // Fetch Grades based on selection
    const { data: grades, isLoading: isLoadingGrades, isError, error } = useQuery({
        queryKey: ["grades", selectedProgrammeType],
        queryFn: () => gradeService.getAllGrades(Number(selectedProgrammeType)),
        enabled: !!selectedProgrammeType,
    });

    return (
        <div className="space-y-6 p-4 md:p-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-[#0F3F2A] tracking-tight flex items-center gap-3">
                        <GraduationCap className="h-8 w-8 text-[#8cc63f]" />
                        Grade Management
                    </h1>
                    <p className="text-muted-foreground font-medium">Configure grading scales and credit values per programme type.</p>
                </div>
            </div>

            {/* Main Content Card */}
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-6 border-b border-border/50 bg-white/50">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                                <Filter className="h-5 w-5 text-primary" />
                                Configuration Registry
                            </CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                Manage grading systems by programme type
                            </CardDescription>
                        </div>

                        {/* Filter Control */}
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="space-y-1.5 flex-1 md:flex-none">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Programme Type</Label>
                                <Select
                                    value={selectedProgrammeType}
                                    onValueChange={setSelectedProgrammeType}
                                    disabled={isLoadingTypes}
                                >
                                    <SelectTrigger className="h-11 w-full md:w-[280px] bg-white border-border/60 focus:ring-primary/20 rounded-xl font-bold text-sm">
                                        <SelectValue placeholder="Select Programme Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {programmeTypes?.map((type) => (
                                            <SelectItem key={type.id} value={type.id.toString()} className="font-medium">
                                                {type.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:pt-[22px]">
                                <CreateGradeModal programmeTypeId={selectedProgrammeType} />
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-6 bg-slate-50/50 min-h-[500px]">
                    {isError ? (
                        <Alert variant="destructive" className="mb-6 bg-red-50 border-red-100">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle className="font-bold">Error Loading Grades</AlertTitle>
                            <AlertDescription className="text-xs font-medium opacity-90">
                                {(error as any)?.message || "Failed to load grade configuration for the selected programme type."}
                            </AlertDescription>
                        </Alert>
                    ) : null}

                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h3 className="font-black text-lg text-slate-700 tracking-tight">Grade Scale</h3>
                            <span className="text-xs font-bold text-muted-foreground bg-white px-3 py-1 rounded-full border border-border/50 shadow-sm">
                                {grades?.length || 0} Grades Configured
                            </span>
                        </div>

                        <GradeList
                            grades={grades || []}
                            isLoading={isLoadingGrades || isLoadingTypes}
                            programmeTypeId={selectedProgrammeType}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default GradeManagement;
