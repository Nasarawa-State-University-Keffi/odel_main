import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/admin/components/admission/components/ui/card";
import { FloatingInput } from "@/features/admin/components/admission/components/ui/floating-input";
import { FloatingSelect } from "@/features/admin/components/admission/components/ui/floating-select";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import { GraduationCap, Plus, Trash2, Upload } from "lucide-react";
import { ApplicationFormData } from "../../types/application";
import { commonService } from "@/features/admin/services/commonService";
import { Label } from "@/features/admin/components/admission/components/ui/label";

export const QualificationSection = () => {
    const { register, control, formState: { errors }, watch } = useFormContext<ApplicationFormData>();
    const { fields, append, remove } = useFieldArray({
        control,
        name: "qualification.results"
    });

    const [qualTypes, setQualTypes] = useState<{ value: string; label: string }[]>([]);
    const [qualGrades, setQualGrades] = useState<{ value: string; label: string }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [types, grades] = await Promise.all([
                    commonService.getQualificationTypes(),
                    commonService.getQualificationGrades()
                ]);
                setQualTypes(types.map(t => ({ value: t.id.toString(), label: t.title })));
                setQualGrades(grades.map(g => ({ value: g.id.toString(), label: g.title })));
            } catch (error) {
                console.warn("Failed to fetch Qualification options:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2 text-xl text-primary">
                        <GraduationCap className="h-5 w-5" />
                        Higher Qualifications
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        Enter details of your higher education qualifications (Degrees, Diplomas, etc.).
                    </p>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {fields.map((item, index) => (
                    <div key={item.id} className="relative pb-6 border-b border-border/50 last:border-0">
                        {index > 0 && (
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => remove(index)}
                                className="absolute right-0 top-0 z-10"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                        <div className="grid gap-6 md:grid-cols-2 mt-4">
                            <div className="space-y-2">
                                <Controller
                                    control={control}
                                    name={`qualification.results.${index}.qualificationId`}
                                    render={({ field }) => (
                                        <FloatingSelect
                                            label="Qualification Type"
                                            options={qualTypes}
                                            value={field.value?.toString()}
                                            onChange={(e) => field.onChange(e.target.value)}
                                            disabled={loading}
                                        />
                                    )}
                                />
                                {errors.qualification?.results?.[index]?.qualificationId && (
                                    <p className="text-xs text-destructive mt-1">{errors.qualification.results[index]?.qualificationId?.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <FloatingInput
                                    id={`qualification.results.${index}.school`}
                                    label="Institution Name"
                                    {...register(`qualification.results.${index}.school`)}
                                />
                                {errors.qualification?.results?.[index]?.school && (
                                    <p className="text-xs text-destructive mt-1">{errors.qualification.results[index]?.school?.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <FloatingInput
                                    id={`qualification.results.${index}.courseOfStudy`}
                                    label="Course of Study"
                                    {...register(`qualification.results.${index}.courseOfStudy`)}
                                />
                                {errors.qualification?.results?.[index]?.courseOfStudy && (
                                    <p className="text-xs text-destructive mt-1">{errors.qualification.results[index]?.courseOfStudy?.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <FloatingInput
                                    id={`qualification.results.${index}.year`}
                                    label="Year Obtained"
                                    type="number"
                                    {...register(`qualification.results.${index}.year`)}
                                />
                                {errors.qualification?.results?.[index]?.year && (
                                    <p className="text-xs text-destructive mt-1">{errors.qualification.results[index]?.year?.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Controller
                                    control={control}
                                    name={`qualification.results.${index}.gradeId`}
                                    render={({ field }) => (
                                        <FloatingSelect
                                            label="Grade"
                                            options={qualGrades}
                                            value={field.value?.toString()}
                                            onChange={(e) => field.onChange(e.target.value)}
                                            disabled={loading}
                                        />
                                    )}
                                />
                                {errors.qualification?.results?.[index]?.gradeId && (
                                    <p className="text-xs text-destructive mt-1">{errors.qualification.results[index]?.gradeId?.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs">Certificate Upload (Max 2MB)</Label>
                                <div className="flex items-center gap-2">
                                    <label className="flex-1 cursor-pointer">
                                        <div className="flex items-center justify-center w-full h-10 px-3 py-2 text-sm border rounded-md border-input bg-background hover:bg-accent hover:text-accent-foreground text-muted-foreground">
                                            <Upload className="mr-2 h-4 w-4" />
                                            {watch(`qualification.results.${index}.file`)?.name || "Choose File"}
                                        </div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    // This is tricky with useFieldArray, we might need to handle files array separately or just set it in results for UI state
                                                    // For simple mapping, let's put it in results temporarily
                                                    const newResults = [...watch("qualification.results")];
                                                    newResults[index].file = file;
                                                    // Trigger re-render/state update manually if needed or rely on watch
                                                    // Ideally we set value
                                                    // Using register returned onChange wrapper or setValue
                                                }
                                                // Actually for file inputs in lists, Controller is safer or just use register
                                            }}
                                            {...register(`qualification.results.${index}.file`)}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={() => append({ qualificationId: "", school: "", courseOfStudy: "", year: "", gradeId: "", file: null })}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Another Qualification
                </Button>
            </CardContent>
        </Card>
    );
};
