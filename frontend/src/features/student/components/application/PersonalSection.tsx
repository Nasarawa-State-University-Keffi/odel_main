import { useFormContext, Controller } from "react-hook-form";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { FloatingInput } from "@/features/admin/components/admission/components/ui/floating-input";
import { FloatingSelect } from "@/features/admin/components/admission/components/ui/floating-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/admin/components/admission/components/ui/card";
import { User, Phone, Mail, MapPin, Calendar as CalendarIcon, Globe, Building2, Heart, Hash, Loader2 } from "lucide-react";
import { ApplicationFormData, ApplicationTypeConfig } from "../../types/application";
import { commonService } from "@/features/admin/services/commonService";
import { Popover, PopoverContent, PopoverTrigger } from "@/features/admin/components/admission/components/ui/popover";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import { Calendar } from "@/features/admin/components/admission/components/ui/calendar";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/features/admin/components/admission/components/ui/label";


interface PersonalSectionProps {
    config: ApplicationTypeConfig;
}

export const PersonalSection = ({ config }: PersonalSectionProps) => {
    const { register, control, watch, setValue, formState: { errors } } = useFormContext<ApplicationFormData>();
    const [genderOptions, setGenderOptions] = useState<{ value: string; label: string }[]>([]);
    const [maritalStatusOptions, setMaritalStatusOptions] = useState<{ value: string; label: string }[]>([]);
    const [countryOptions, setCountryOptions] = useState<{ value: string; label: string }[]>([]);
    const [stateOptions, setStateOptions] = useState<{ value: string; label: string }[]>([]);
    const [lgaOptions, setLgaOptions] = useState<{ value: string; label: string }[]>([]);

    const [loading, setLoading] = useState(true);
    const [statesLoading, setStatesLoading] = useState(false);
    const [lgasLoading, setLgasLoading] = useState(false);

    const countryId = watch("personal.countryId");
    const stateId = watch("personal.stateId");
    const allFields = watch();


    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const data = await commonService.getBasicInformation();
                if (data.genders) {
                    setGenderOptions(data.genders.map(g => ({
                        value: g.id.toString(),
                        label: g.title
                    })));
                }
                if (data.maritalStatuses) {
                    setMaritalStatusOptions(data.maritalStatuses.map(m => ({
                        value: m.id.toString(),
                        label: m.title
                    })));
                }

                // Fetch Countries
                const countries = await commonService.getCountries();
                setCountryOptions(countries.map(c => ({
                    value: c.id.toString(),
                    label: c.name
                })));

            } catch (error) {
                console.warn("DIAGNOSTIC: Failed to fetch generic options:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOptions();
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
                    <User className="h-5 w-5" />
                    Personal Information
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <FloatingInput
                        id="personal.firstName"
                        label="First Name"
                        icon={<User className="h-4 w-4 text-muted-foreground" />}
                        {...register("personal.firstName")}
                    />
                    {errors.personal?.firstName && (
                        <p className="text-xs text-destructive mt-1">{errors.personal.firstName.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <FloatingInput
                        id="personal.middleName"
                        label="Middle Name (Optional)"
                        icon={<User className="h-4 w-4 text-muted-foreground" />}
                        {...register("personal.middleName")}
                    />
                </div>

                <div className="space-y-2">
                    <FloatingInput
                        id="personal.lastName"
                        label="Last Name"
                        icon={<User className="h-4 w-4 text-muted-foreground" />}
                        {...register("personal.lastName")}
                    />
                    {errors.personal?.lastName && (
                        <p className="text-xs text-destructive mt-1">{errors.personal.lastName.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <FloatingInput
                        id="personal.phoneNumber"
                        label="Phone Number"
                        icon={<Phone className="h-4 w-4 text-muted-foreground" />}
                        {...register("personal.phoneNumber")}
                    />
                    {errors.personal?.phoneNumber && (
                        <p className="text-xs text-destructive mt-1">{errors.personal.phoneNumber.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <FloatingInput
                        id="personal.email"
                        label="Email Address"
                        readOnly
                        className="opacity-75 cursor-not-allowed"
                        icon={<Mail className="h-4 w-4 text-muted-foreground" />}
                        {...register("personal.email")}
                    />
                </div>

                <div className="space-y-2">
                    <Controller
                        name="personal.dob"
                        control={control}
                        render={({ field }) => (
                            <div className="relative mb-4">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full h-12 justify-start text-left font-normal bg-background border-input transition-all duration-200  hover:border-primary/50",
                                                !field.value && "text-muted-foreground",
                                                field.value && "pt-2",
                                                errors.personal?.dob && "border-destructive hover:border-destructive"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                            {field.value && !isNaN(new Date(field.value).getTime()) ? (
                                                format(new Date(field.value), "PPP")
                                            ) : (
                                                <span className="opacity-0">Date of Birth</span>
                                            )}

                                            <motion.div
                                                initial={false}
                                                animate={field.value ? { y: -24, scale: 0.85, color: "hsl(var(--primary))" } : { y: 0, scale: 1, color: "hsl(var(--muted-foreground))" }}
                                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                className="absolute left-9 top-2.5 pointer-events-none origin-top-left"
                                            >
                                                <Label className={cn("cursor-text font-normal", errors.personal?.dob && "text-destructive")}>
                                                    Date of Birth
                                                </Label>
                                            </motion.div>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 border-border/50 bg-card/95 backdrop-blur-xl" align="start">
                                        <Calendar
                                            mode="single"
                                            captionLayout="dropdown-buttons"
                                            fromYear={1900}
                                            toYear={new Date().getFullYear()}
                                            selected={field.value ? new Date(field.value) : undefined}
                                            onSelect={(date) => {
                                                if (date) {
                                                    field.onChange(format(date, "yyyy-MM-dd"));
                                                }
                                            }}
                                            disabled={(date) =>
                                                date > new Date() || date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                            className="rounded-md"
                                        />
                                    </PopoverContent>
                                </Popover>
                                <AnimatePresence>
                                    {errors.personal?.dob && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            className="text-xs text-destructive mt-1 ml-1"
                                        >
                                            {errors.personal.dob.message}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    />
                </div>

                <div className="space-y-2">
                    <Controller
                        name="personal.genderId"
                        control={control}
                        render={({ field }) => (
                            <FloatingSelect
                                label="Gender"
                                options={genderOptions}
                                value={field.value?.toString()}
                                onChange={(e) => field.onChange(e.target.value)}
                                disabled={loading}
                                icon={loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <User className="h-4 w-4 text-muted-foreground" />}
                            />
                        )}
                    />
                    {errors.personal?.genderId && (
                        <p className="text-xs text-destructive mt-1">{errors.personal.genderId.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Controller
                        name="personal.maritalStatusId"
                        control={control}
                        render={({ field }) => (
                            <FloatingSelect
                                label="Marital Status"
                                options={maritalStatusOptions}
                                value={field.value?.toString()}
                                onChange={(e) => field.onChange(e.target.value)}
                                disabled={loading}
                            />
                        )}
                    />
                    {errors.personal?.maritalStatusId && (
                        <p className="text-xs text-destructive mt-1">{errors.personal.maritalStatusId.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Controller
                        name="personal.countryId"
                        control={control}
                        render={({ field }) => (
                            <FloatingSelect
                                label="Country"
                                options={countryOptions}
                                value={field.value?.toString()}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    field.onChange(val);
                                    setValue("personal.stateId", "");
                                    setValue("personal.lgaId", "");
                                }}
                                disabled={loading}
                            />
                        )}
                    />
                    {errors.personal?.countryId && (
                        <p className="text-xs text-destructive mt-1">{errors.personal.countryId.message}</p>
                    )}
                </div>


                <div className="space-y-2">
                    <Controller
                        name="personal.stateId"
                        control={control}
                        render={({ field }) => (
                            <FloatingSelect
                                label="State of Origin"
                                options={stateOptions}
                                value={field.value?.toString()}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    field.onChange(val);
                                    setValue("personal.lgaId", "");
                                }}
                                disabled={statesLoading || !countryId}
                                icon={statesLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <MapPin className="h-4 w-4 text-muted-foreground" />}
                            />
                        )}
                    />
                    {errors.personal?.stateId && (
                        <p className="text-xs text-destructive mt-1">{errors.personal.stateId.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Controller
                        name="personal.lgaId"
                        control={control}
                        render={({ field }) => (
                            <FloatingSelect
                                label="LGA"
                                options={lgaOptions}
                                value={field.value?.toString()}
                                onChange={(e) => field.onChange(e.target.value)}
                                disabled={lgasLoading || !stateId}
                            />
                        )}
                    />
                    {errors.personal?.lgaId && (
                        <p className="text-xs text-destructive mt-1">{errors.personal.lgaId.message}</p>
                    )}
                </div>


                <div className="space-y-2">
                    <FloatingInput
                        id="personal.placeOfBirth"
                        label="Place of Birth"
                        icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
                        {...register("personal.placeOfBirth")}
                    />
                    {errors.personal?.placeOfBirth && (
                        <p className="text-xs text-destructive mt-1">{errors.personal.placeOfBirth.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <FloatingInput
                        id="personal.homeTown"
                        label="Home Town"
                        icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
                        {...register("personal.homeTown")}
                    />
                    {errors.personal?.homeTown && (
                        <p className="text-xs text-destructive mt-1">{errors.personal.homeTown.message}</p>
                    )}
                </div>




                {config?.utmeDetailsEnabled && (
                    <div className="space-y-2">
                        <FloatingInput
                            id="personal.utmeReg"
                            label="UTME Registration Number"
                            icon={<Hash className="h-4 w-4 text-muted-foreground" />}
                            {...register("personal.utmeReg")}
                        />
                        {errors.personal?.utmeReg && (
                            <p className="text-xs text-destructive mt-1">{errors.personal.utmeReg.message}</p>
                        )}
                    </div>
                )}

            </CardContent>
        </Card>
    );
};
