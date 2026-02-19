import { useFormContext, Controller } from "react-hook-form";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/admin/components/admission/components/ui/card";
import { FloatingInput } from "@/features/admin/components/admission/components/ui/floating-input";
import { FloatingSelect } from "@/features/admin/components/admission/components/ui/floating-select";
import { Users } from "lucide-react";
import { ApplicationFormData } from "../../types/application";
import { commonService } from "@/features/admin/services/commonService";

export const NextOfKinSection = () => {
    const { register, control, formState: { errors } } = useFormContext<ApplicationFormData>();
    const [relationshipOptions, setRelationshipOptions] = useState<{ value: string; label: string }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const data = await commonService.getBasicInformation();
                if (data.relationships) {
                    setRelationshipOptions(data.relationships.map(r => ({
                        value: r.id.toString(),
                        label: r.title
                    })));
                } else if ((data as any).relations) {
                    // Fallback if key differs
                    setRelationshipOptions((data as any).relations.map((r: any) => ({
                        value: r.id.toString(),
                        label: r.title
                    })));
                }
            } catch (error) {
                console.warn("Failed to fetch next of kin options:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOptions();
    }, []);

    return (
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-primary">
                    <Users className="h-5 w-5" />
                    Next of Kin Information
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                    <FloatingInput
                        id="nextOfKin.fullName"
                        label="Full Name*"
                        {...register("nextOfKin.fullName")}
                    />
                    {errors.nextOfKin?.fullName && (
                        <p className="text-xs text-destructive mt-1">{errors.nextOfKin.fullName.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Controller
                        name="nextOfKin.relationshipId"
                        control={control}
                        render={({ field }) => (
                            <FloatingSelect
                                label="Relationship*"
                                options={relationshipOptions}
                                value={field.value?.toString()}
                                onChange={(e) => field.onChange(e.target.value)}
                                disabled={loading}
                            />
                        )}
                    />
                    {errors.nextOfKin?.relationshipId && (
                        <p className="text-xs text-destructive mt-1">{errors.nextOfKin.relationshipId.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <FloatingInput
                        id="nextOfKin.phoneNumber"
                        label="Phone Number*"
                        {...register("nextOfKin.phoneNumber")}
                    />
                    {errors.nextOfKin?.phoneNumber && (
                        <p className="text-xs text-destructive mt-1">{errors.nextOfKin.phoneNumber.message}</p>
                    )}
                </div>

                <div className="space-y-2 md:col-span-2">
                    <FloatingInput
                        id="nextOfKin.address"
                        label="Residential Address*"
                        {...register("nextOfKin.address")}
                    />
                    {errors.nextOfKin?.address && (
                        <p className="text-xs text-destructive mt-1">{errors.nextOfKin.address.message}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
