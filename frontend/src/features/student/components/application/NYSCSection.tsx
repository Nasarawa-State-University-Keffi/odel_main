import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/admin/components/admission/components/ui/card";
import { FloatingInput } from "@/features/admin/components/admission/components/ui/floating-input";
import { Flag } from "lucide-react";
import { ApplicationFormData } from "../../types/application";

export const NYSCSection = () => {
    const { register, formState: { errors } } = useFormContext<ApplicationFormData>();

    return (
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-primary">
                    <Flag className="h-5 w-5" />
                    NYSC Details
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <FloatingInput
                        id="nysc.nyscNumber"
                        label="NYSC Number"
                        {...register("nysc.nyscNumber")}
                    />
                </div>
                <div className="space-y-2">
                    <FloatingInput
                        id="nysc.yearOfService"
                        label="Year of Service"
                        type="number"
                        {...register("nysc.yearOfService")}
                    />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <FloatingInput
                        id="nysc.stateOfDeployment"
                        label="State of Deployment"
                        {...register("nysc.stateOfDeployment")}
                    />
                </div>
            </CardContent>
        </Card>
    );
};
