import { useFormContext, Controller } from "react-hook-form";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/admin/components/admission/components/ui/card";
import { FloatingSelect } from "@/features/admin/components/admission/components/ui/floating-select";
import { BookOpenText } from "lucide-react";
import { ApplicationFormData } from "../../types/application";
import { programmeService } from "@/features/admin/services/programmeService";
import { programmeTypeService } from "@/features/admin/services/programmeTypeService";

export const ProgrammeSection = () => {
    const { control, formState: { errors } } = useFormContext<ApplicationFormData>();
    const [programmes, setProgrammes] = useState<{ value: string; label: string }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProgrammes = async () => {

            // caching the programmes so we dont keep making requests to the server
            const CACHE_KEY = "cached_odel_programmes";
            const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours( for an hour)

            try {
                // Check cache first
                const cachedData = localStorage.getItem(CACHE_KEY);
                if (cachedData) {
                    const { data, timestamp } = JSON.parse(cachedData);
                    if (Date.now() - timestamp < CACHE_DURATION) {
                        setProgrammes(data);
                        setLoading(false);
                        return; // Exit if cache is valid (background refresh can be added if needed)
                    }
                }

                // 1. Get All Programme Types to find ODEL ID
                const types = await programmeTypeService.getAllProgrammeTypes();
                const odelType = types.find(t =>
                    t.name.toLowerCase().includes("odel") ||
                    t.name.toLowerCase().includes("distance")
                );

                if (odelType) {
                    // 2. Fetch Programmes specifically for ODEL type
                    const data = await programmeService.getAllProgrammes(odelType.id);
                    const formattedProgrammes = data.map(p => ({ value: p.id.toString(), label: `${p.name} (${p.code})` }));

                    setProgrammes(formattedProgrammes);

                    // Update cache
                    localStorage.setItem(CACHE_KEY, JSON.stringify({
                        data: formattedProgrammes,
                        timestamp: Date.now()
                    }));
                } else {
                    console.warn("ODEL Programme Type not found.");
                    setProgrammes([]);
                }
            } catch (error) {
                console.warn("Failed to fetch programmes:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProgrammes();
    }, []);

    return (
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-primary">
                    <BookOpenText className="h-5 w-5" />
                    Programme Selection
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    Select the academic programme you wish to apply for.
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Controller
                        control={control}
                        name="programme.programmeId"
                        render={({ field }) => (
                            <FloatingSelect
                                label="Select Programme"
                                options={programmes}
                                value={field.value?.toString()}
                                onChange={(e) => field.onChange(e.target.value)}
                                disabled={loading}
                                isLoading={loading}
                            />
                        )}
                    />
                    {errors.programme?.programmeId && (
                        <p className="text-xs text-destructive mt-1">{errors.programme.programmeId.message}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );

}
