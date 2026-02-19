import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/admin/components/admission/components/ui/card";
import { FloatingInput } from "@/features/admin/components/admission/components/ui/floating-input";
import { FloatingSelect } from "@/features/admin/components/admission/components/ui/floating-select";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import { Plus, Trash2, GraduationCap } from "lucide-react";
import { ApplicationFormData, ApplicationTypeConfig } from "../../types/application";
import { commonService } from "@/features/admin/services/commonService";

interface OLevelSectionProps {
    config: ApplicationTypeConfig;
}

export const OLevelSection = ({ config }: OLevelSectionProps) => {
    const { register, control, watch, formState: { errors } } = useFormContext<ApplicationFormData>();
    const { fields, append, remove } = useFieldArray({
        control,
        name: "olevel.results"
    });

    const [organizations, setOrganizations] = useState<{ value: string; label: string }[]>([]);
    const [examTypes, setExamTypes] = useState<{ value: string; label: string }[]>([]);
    const [subjects, setSubjects] = useState<{ value: string; label: string }[]>([]);
    const [grades, setGrades] = useState<{ value: string; label: string }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [orgs, types, subs, gra] = await Promise.all([
                    commonService.getSsceOrganizations(),
                    commonService.getSsceExamTypes(),
                    commonService.getSsceSubjects(),
                    commonService.getSsceGrades()
                ]);
                setOrganizations(orgs.map(o => ({ value: o.id.toString(), label: o.title })));
                setExamTypes(types.map(t => ({ value: t.id.toString(), label: t.title })));
                setSubjects(subs.map(s => ({ value: s.id.toString(), label: s.title })));
                setGrades(gra.map(g => ({ value: g.id.toString(), label: `${g.title}` })));
            } catch (error) {
                console.warn("Failed to fetch SSCE options:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Helper to generate subject grid
    const renderSubjectRows = (sittingIndex: number, numberOfSubjects: number) => {
        const rows = [];
        for (let i = 1; i <= numberOfSubjects; i++) {
            rows.push(
                <div key={i} className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Controller
                            control={control}
                            name={`olevel.results.${sittingIndex}.subject${i}` as any}
                            render={({ field }) => (
                                <FloatingSelect
                                    label={`Subject ${i}`}
                                    options={subjects}
                                    value={field.value?.toString()}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    disabled={loading}
                                />
                            )}
                        />
                        {errors.olevel?.results?.[sittingIndex]?.[`subject${i}` as keyof typeof errors.olevel.results[number]] && (
                            <p className="text-xs text-destructive mt-1">Required</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Controller
                            control={control}
                            name={`olevel.results.${sittingIndex}.grade${i}` as any}
                            render={({ field }) => (
                                <FloatingSelect
                                    label={`Grade ${i}`}
                                    options={grades}
                                    value={field.value?.toString()}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    disabled={loading}
                                />
                            )}
                        />
                        {errors.olevel?.results?.[sittingIndex]?.[`grade${i}` as keyof typeof errors.olevel.results[number]] && (
                            <p className="text-xs text-destructive mt-1">Required</p>
                        )}
                    </div>
                </div>
            );
        }
        return rows;
    };

    const maxQualifications = config.numberOfQualifications || 2;

    return (
        <div className="space-y-6">
            {fields.map((field, index) => {
                // Watch logic inside map for dynamic fields per sitting if needed
                // For performance valid to watch specific fields if heavy, but here straightforward
                const numSubjects = watch(`olevel.results.${index}.numberOfSubjects`) || 5;

                return (
                    <Card key={field.id} className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm relative">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-xl text-primary">
                                <GraduationCap className="h-5 w-5" />
                                Sitting {index + 1}
                            </CardTitle>
                            {index > 0 && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => remove(index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <FloatingInput
                                        id={`olevel.results.${index}.registrationNumber`}
                                        label="Registration Number"
                                        {...register(`olevel.results.${index}.registrationNumber`)}
                                    />
                                    {errors.olevel?.results?.[index]?.registrationNumber && (
                                        <p className="text-xs text-destructive mt-1">{errors.olevel.results[index]?.registrationNumber?.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <FloatingInput
                                        id={`olevel.results.${index}.year`}
                                        label="Exam Year"
                                        type="number"
                                        {...register(`olevel.results.${index}.year`)}
                                    />
                                    {errors.olevel?.results?.[index]?.year && (
                                        <p className="text-xs text-destructive mt-1">{errors.olevel.results[index]?.year?.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Controller
                                        control={control}
                                        name={`olevel.results.${index}.organization`}
                                        render={({ field }) => (
                                            <FloatingSelect
                                                label="Organization"
                                                options={organizations}
                                                value={field.value?.toString()}
                                                onChange={(e) => field.onChange(e.target.value)}
                                                disabled={loading}
                                            />
                                        )}
                                    />
                                    {errors.olevel?.results?.[index]?.organization && (
                                        <p className="text-xs text-destructive mt-1">{errors.olevel.results[index]?.organization?.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Controller
                                        control={control}
                                        name={`olevel.results.${index}.examType`}
                                        render={({ field }) => (
                                            <FloatingSelect
                                                label="Exam Type"
                                                options={examTypes}
                                                value={field.value?.toString()}
                                                onChange={(e) => field.onChange(e.target.value)}
                                                disabled={loading}
                                            />
                                        )}
                                    />
                                    {errors.olevel?.results?.[index]?.examType && (
                                        <p className="text-xs text-destructive mt-1">{errors.olevel.results[index]?.examType?.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <FloatingInput
                                        id={`olevel.results.${index}.numberOfSubjects`}
                                        label="Number of Subjects"
                                        type="number"
                                        min={5}
                                        max={9}
                                        {...register(`olevel.results.${index}.numberOfSubjects`, { valueAsNumber: true })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-medium text-muted-foreground">Subjects & Grades</h4>
                                {renderSubjectRows(index, numSubjects)}
                            </div>
                        </CardContent>
                    </Card>
                )
            })}

            {fields.length < maxQualifications && (
                <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={() => append({
                        registrationNumber: "", year: "", organization: "", examType: "", numberOfSubjects: 5,
                        subject1: "", grade1: "", subject2: "", grade2: "", subject3: "", grade3: "", subject4: "", grade4: "", subject5: "", grade5: ""
                    })}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Another Sitting
                </Button>
            )}
        </div>
    );
};
