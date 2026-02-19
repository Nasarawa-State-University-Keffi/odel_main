import { useFormContext, Controller } from "react-hook-form";
import { useEffect, useState } from "react";
import { FloatingInput } from "@/features/admin/components/admission/components/ui/floating-input";
import { FloatingSelect } from "@/features/admin/components/admission/components/ui/floating-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/admin/components/admission/components/ui/card";
import { MapPin, Loader2, Globe, Building2 } from "lucide-react";
import { ApplicationFormData } from "../../types/application";
import { commonService } from "@/features/admin/services/commonService";

export const ContactSection = () => {
    const { register, control, watch, setValue, formState: { errors } } = useFormContext<ApplicationFormData>();

    const [countryOptions, setCountryOptions] = useState<{ value: string; label: string }[]>([]);
    const [stateOptions, setStateOptions] = useState<{ value: string; label: string }[]>([]);
    const [lgaOptions, setLgaOptions] = useState<{ value: string; label: string }[]>([]);

    const [loading, setLoading] = useState(true);
    const [statesLoading, setStatesLoading] = useState(false);
    const [lgasLoading, setLgasLoading] = useState(false);

    const countryId = watch("contact.countryId");
    const stateId = watch("contact.stateId");

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const countries = await commonService.getCountries();
                setCountryOptions(countries.map(c => ({
                    value: c.id.toString(),
                    label: c.name
                })));
            } catch (error) {
                console.error("Failed to fetch countries:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCountries();
    }, []);

    // Fetch States when Country changes
    useEffect(() => {
        if (!countryId) {
            setStateOptions([]);
            return;
        }

        const fetchStates = async () => {
            setStatesLoading(true);
            try {
                const states = await commonService.getStatesByCountry(Number(countryId));
                setStateOptions(states.map(s => ({
                    value: s.id.toString(),
                    label: s.name
                })));
            } catch (error) {
                console.error("Failed to fetch states:", error);
                setStateOptions([]);
            } finally {
                setStatesLoading(false);
            }
        };

        fetchStates();
    }, [countryId]);

    // Fetch LGAs when State changes
    useEffect(() => {
        if (!stateId) {
            setLgaOptions([]);
            return;
        }

        const fetchLgas = async () => {
            setLgasLoading(true);
            try {
                const lgas = await commonService.getLgasByState(Number(stateId));
                setLgaOptions(lgas.map(l => ({
                    value: l.id.toString(),
                    label: l.name
                })));
            } catch (error) {
                console.error("Failed to fetch LGAs:", error);
                setLgaOptions([]);
            } finally {
                setLgasLoading(false);
            }
        };

        fetchLgas();
    }, [stateId]);

    return (
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-primary">
                    <MapPin className="h-5 w-5" />
                    Contact Information
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">

                <div className="space-y-2">
                    <Controller
                        name="contact.countryId"
                        control={control}
                        render={({ field }) => (
                            <FloatingSelect
                                label="Country"
                                options={countryOptions}
                                value={field.value?.toString()}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    field.onChange(val);
                                    setValue("contact.stateId", "");
                                    setValue("contact.lgaId", "");
                                }}
                                disabled={loading}
                                icon={loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <Globe className="h-4 w-4 text-muted-foreground" />}
                            />
                        )}
                    />
                    {errors.contact?.countryId && (
                        <p className="text-xs text-destructive mt-1">{errors.contact.countryId.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Controller
                        name="contact.stateId"
                        control={control}
                        render={({ field }) => (
                            <FloatingSelect
                                label="State of Residence"
                                options={stateOptions}
                                value={field.value?.toString()}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    field.onChange(val);
                                    setValue("contact.lgaId", "");
                                }}
                                disabled={statesLoading || !countryId}
                                icon={statesLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <MapPin className="h-4 w-4 text-muted-foreground" />}
                            />
                        )}
                    />
                    {errors.contact?.stateId && (
                        <p className="text-xs text-destructive mt-1">{errors.contact.stateId.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Controller
                        name="contact.lgaId"
                        control={control}
                        render={({ field }) => (
                            <FloatingSelect
                                label="LGA of Residence"
                                options={lgaOptions}
                                value={field.value?.toString()}
                                onChange={(e) => field.onChange(e.target.value)}
                                disabled={lgasLoading || !stateId}
                                icon={lgasLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <Building2 className="h-4 w-4 text-muted-foreground" />}
                            />
                        )}
                    />
                    {errors.contact?.lgaId && (
                        <p className="text-xs text-destructive mt-1">{errors.contact.lgaId.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <FloatingInput
                        id="contact.address"
                        label="Detailed Home Address"
                        icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
                        {...register("contact.address")}
                    />
                    {errors.contact?.address && (
                        <p className="text-xs text-destructive mt-1">{errors.contact.address.message}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
