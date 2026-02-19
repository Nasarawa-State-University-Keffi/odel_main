import { useFormContext, Controller } from "react-hook-form";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/admin/components/admission/components/ui/card";
import { FloatingInput } from "@/features/admin/components/admission/components/ui/floating-input";
import { FloatingSelect } from "@/features/admin/components/admission/components/ui/floating-select";
import { GraduationCap } from "lucide-react";
import { ApplicationFormData } from "../../types/application";
import { commonService } from "@/features/admin/services/commonService";

export const UtmeSection = () => {
    const { register, control, formState: { errors } } = useFormContext<ApplicationFormData>();
    const [subjectOptions, setSubjectOptions] = useState<{ value: string; label: string }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const subjects = await commonService.getJambSubjects();
                setSubjectOptions(subjects.map(s => ({
                    value: s.id.toString(),
                    label: `${s.title} (${s.code})`
                })));
            } catch (error) {
                console.warn("Failed to fetch JAMB subjects:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSubjects();
    }, []);

    return (
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-primary">
                    <GraduationCap className="h-5 w-5" />
                    UTME Examination Details
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <FloatingInput
                        id="utme.jambRegNumber"
                        label="JAMB Registration Number"
                        {...register("utme.jambRegNumber")}
                    />
                    {errors.utme?.jambRegNumber && (
                        <p className="text-xs text-destructive mt-1">{errors.utme.jambRegNumber.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <FloatingInput
                        id="utme.year"
                        label="Examination Year"
                        type="number"
                        {...register("utme.year")}
                    />
                    {errors.utme?.year && (
                        <p className="text-xs text-destructive mt-1">{errors.utme.year.message}</p>
                    )}
                </div>

                {/* Subject 1 */}
                <div className="space-y-2">
                    <Controller
                        name="utme.subject1"
                        control={control}
                        render={({ field }) => (
                            <FloatingSelect
                                label="Subject 1"
                                options={subjectOptions}
                                value={field.value?.toString()}
                                onChange={(e) => field.onChange(e.target.value)}
                                disabled={loading}
                            />
                        )}
                    />
                    {errors.utme?.subject1 && (
                        <p className="text-xs text-destructive mt-1">{errors.utme.subject1.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <FloatingInput
                        id="utme.score1"
                        label="Score 1"
                        type="number"
                        {...register("utme.score1")}
                    />
                    {errors.utme?.score1 && (
                        <p className="text-xs text-destructive mt-1">{errors.utme.score1.message}</p>
                    )}
                </div>

                {/* Subject 2 */}
                <div className="space-y-2">
                    <Controller
                        name="utme.subject2"
                        control={control}
                        render={({ field }) => (
                            <FloatingSelect
                                label="Subject 2"
                                options={subjectOptions}
                                value={field.value?.toString()}
                                onChange={(e) => field.onChange(e.target.value)}
                                disabled={loading}
                            />
                        )}
                    />
                    {errors.utme?.subject2 && (
                        <p className="text-xs text-destructive mt-1">{errors.utme.subject2.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <FloatingInput
                        id="utme.score2"
                        label="Score 2"
                        type="number"
                        {...register("utme.score2")}
                    />
                    {errors.utme?.score2 && (
                        <p className="text-xs text-destructive mt-1">{errors.utme.score2.message}</p>
                    )}
                </div>

                {/* Subject 3 */}
                <div className="space-y-2">
                    <Controller
                        name="utme.subject3"
                        control={control}
                        render={({ field }) => (
                            <FloatingSelect
                                label="Subject 3"
                                options={subjectOptions}
                                value={field.value?.toString()}
                                onChange={(e) => field.onChange(e.target.value)}
                                disabled={loading}
                            />
                        )}
                    />
                    {errors.utme?.subject3 && (
                        <p className="text-xs text-destructive mt-1">{errors.utme.subject3.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <FloatingInput
                        id="utme.score3"
                        label="Score 3"
                        type="number"
                        {...register("utme.score3")}
                    />
                    {errors.utme?.score3 && (
                        <p className="text-xs text-destructive mt-1">{errors.utme.score3.message}</p>
                    )}
                </div>

                {/* Subject 4 */}
                <div className="space-y-2">
                    <Controller
                        name="utme.subject4"
                        control={control}
                        render={({ field }) => (
                            <FloatingSelect
                                label="Subject 4"
                                options={subjectOptions}
                                value={field.value?.toString()}
                                onChange={(e) => field.onChange(e.target.value)}
                                disabled={loading}
                            />
                        )}
                    />
                    {errors.utme?.subject4 && (
                        <p className="text-xs text-destructive mt-1">{errors.utme.subject4.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <FloatingInput
                        id="utme.score4"
                        label="Score 4"
                        type="number"
                        {...register("utme.score4")}
                    />
                    {errors.utme?.score4 && (
                        <p className="text-xs text-destructive mt-1">{errors.utme.score4.message}</p>
                    )}
                </div>

            </CardContent>
        </Card>
    );
};
