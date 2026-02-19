import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/admin/components/admission/components/ui/card";
import { Upload, Image as ImageIcon } from "lucide-react";
import { ApplicationFormData, ApplicationTypeConfig } from "../../types/application";
import { Input } from "@/features/admin/components/admission/components/ui/input";
import { Label } from "@/features/admin/components/admission/components/ui/label";

import { useState, useEffect } from "react";

interface DocumentUploadSectionProps {
    config: ApplicationTypeConfig;
}

export const PassportUploadSection = ({ config }: DocumentUploadSectionProps) => {
    const { register, formState: { errors }, setValue, watch } = useFormContext<ApplicationFormData>();
    const [preview, setPreview] = useState<string | null>(null);

    // Watch for existing passport (e.g. from mappedData) if mappedData puts a string url or file object
    // Assuming for now simplistic handling
    const passportValue = watch("passport");

    useEffect(() => {
        if (passportValue instanceof File) {
            const objectUrl = URL.createObjectURL(passportValue);
            setPreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        } else if (typeof passportValue === 'string' && passportValue) {
            // If mapped from existing data as a URL string
            setPreview(passportValue);
        }
    }, [passportValue]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setValue("passport", file, { shouldValidate: true, shouldDirty: true });
        }
    };

    return (
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-primary">
                    <Upload className="h-5 w-5" />
                    Passport Upload
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="passport">Passport Photograph</Label>
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative pt-4">
                            {preview ? (
                                <img src={preview} alt="Passport Preview" className="h-32 w-32 rounded-full object-cover border-4 border-primary/20" />
                            ) : (
                                <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center border-4 border-muted-foreground/20">
                                    <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                                </div>
                            )}
                        </div>

                        <div className="border-2 border-dashed border-border/50 rounded-lg p-6 w-full flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                            <input
                                id="passport"
                                type="file"
                                accept="image/jpeg,image/png,image/jpg"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleFileChange}
                            />
                            <Upload className="h-8 w-8 text-primary mb-2" />
                            <p className="text-sm font-medium">Click to upload passport</p>
                            <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 2MB</p>
                        </div>
                    </div>
                    {errors.passport && (
                        <p className="text-xs text-destructive mt-1 text-center">{errors.passport.message as string}</p>
                    )}
                </div>

            </CardContent>
        </Card>
    );
};
