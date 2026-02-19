import { useFieldArray, useFormContext } from "react-hook-form";
import { FloatingInput } from "@/features/admin/components/admission/components/ui/floating-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/admin/components/admission/components/ui/card";
import { Users, UserPlus } from "lucide-react";
import { ApplicationFormData, ApplicationTypeConfig } from "../../types/application";
import { useEffect } from "react";

interface RefereeSectionProps {
    config: ApplicationTypeConfig;
}

export const RefereeSection = ({ config }: RefereeSectionProps) => {
    const { register, control, formState: { errors } } = useFormContext<ApplicationFormData>();
    const { fields, append, remove, replace } = useFieldArray({
        control,
        name: "referees"
    });

    const numberOfReferees = config.numberOfReferees || 1;

    useEffect(() => {
        // Ensure strictly 'numberOfReferees' fields exist
        if (fields.length !== numberOfReferees) {
            const refereesFn = Array(numberOfReferees).fill({
                fullName: "",
                email: "",
                phoneNumber: "",
                address: ""
            });
            replace(refereesFn);
        }
    }, [numberOfReferees, replace]);


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Referee Details
                </h2>
            </div>
            <p className="text-sm text-muted-foreground">
                Please provide details for {numberOfReferees} referee{numberOfReferees > 1 ? 's' : ''}.
            </p>

            {fields.map((field, index) => (
                <Card key={field.id} className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex justify-between items-center">
                            <span>Referee {index + 1}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2 pt-4">
                        <div className="space-y-2">
                            <FloatingInput
                                label="Full Name"
                                {...register(`referees.${index}.fullName`)}
                            />
                            {errors.referees?.[index]?.fullName && (
                                <p className="text-xs text-destructive mt-1">{errors.referees[index]?.fullName?.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <FloatingInput
                                label="Email Address"
                                type="email"
                                {...register(`referees.${index}.email`)}
                            />
                            {errors.referees?.[index]?.email && (
                                <p className="text-xs text-destructive mt-1">{errors.referees[index]?.email?.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <FloatingInput
                                label="Phone Number"
                                type="tel"
                                {...register(`referees.${index}.phoneNumber`)}
                            />
                            {errors.referees?.[index]?.phoneNumber && (
                                <p className="text-xs text-destructive mt-1">{errors.referees[index]?.phoneNumber?.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <FloatingInput
                                label="Address"
                                {...register(`referees.${index}.address`)}
                            />
                            {errors.referees?.[index]?.address && (
                                <p className="text-xs text-destructive mt-1">{errors.referees[index]?.address?.message}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
