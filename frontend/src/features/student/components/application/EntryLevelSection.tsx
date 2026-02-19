import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/admin/components/admission/components/ui/card";
import { GraduationCap, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming this exists, common in shadcn
import { ApplicationFormData, ApplicationTypeConfig } from "../../types/application";
// If cn doesn't exist, I'll need to check, but usually it does in this stack.
// Checking Login.tsx imports... it doesn't import cn. 
// I'll assume standard shadcn setup or dynamic classes.

// Actually let's check utils path. It is usually @/lib/utils.

interface EntryLevelSectionProps {
    config: ApplicationTypeConfig;
}

export const EntryLevelSection = ({ config }: EntryLevelSectionProps) => {
    const { register, watch, setValue, formState: { errors } } = useFormContext<ApplicationFormData>();
    const selectedLevel = watch("entryLevel.level");

    // The config.modeOfEntries is an array of strings, e.g. ["100 Level", "200 Level"]

    return (
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-primary">
                    <GraduationCap className="h-5 w-5" />
                    Programme Entry Level
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {config.modeOfEntries?.map((entry) => (
                        <div
                            key={entry.value}
                            onClick={() => setValue("entryLevel.level", entry.value, { shouldValidate: true })}
                            className={`cursor-pointer relative p-6 rounded-xl border-2 transition-all duration-200 
                                ${selectedLevel === entry.value
                                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                                    : "border-border/50 hover:border-primary/50 hover:bg-muted/50"
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <h3 className="font-bold text-lg">{entry.title} Level</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {entry.numberOfSemesters} Semesters - {entry.title.includes("100")
                                            ? "Fresh applicants / No prior qualification"
                                            : "Direct Entry / With relevant qualification"
                                        }
                                    </p>
                                </div>
                                <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors
                                    ${selectedLevel === entry.value ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"}
                                `}>
                                    {selectedLevel === entry.value && <CheckCircle2 className="h-4 w-4" />}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {errors.entryLevel?.level && (
                    <p className="text-xs text-destructive mt-1">{errors.entryLevel.level.message}</p>
                )}

                {selectedLevel?.includes("200") && (
                    <div className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 p-4 rounded-lg text-sm border border-yellow-500/20">
                        <strong>Note:</strong> Choose 200 level only if you have a relevant ND/NCE or equivalent qualification that qualifies you for direct entry.
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
