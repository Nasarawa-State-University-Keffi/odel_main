import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Book, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { staffService } from "@/features/admin/services/staffService";
import { useMemo } from "react";

interface ProgrammeSelectorProps {
    selectedProgramme: string;
    onSelectProgramme: (value: string) => void;
}

const ProgrammeSelector = ({ selectedProgramme, onSelectProgramme }: ProgrammeSelectorProps) => {
    // Fetch All Programmes
    const {
        data: programmes = [],
        isLoading: isProgrammesLoading,
        isError: isProgrammesError,
    } = useQuery({
        queryKey: ["programmes"],
        queryFn: staffService.getAllProgrammes,
    });

    // Filter for ODEL Programmes
    const odelProgrammes = useMemo(() => {
        return programmes.filter(p => p.programmeType?.name?.toUpperCase()?.includes("ODEL") || p.programmeType?.name?.toUpperCase()?.includes("DISTANCE"));
    }, [programmes]);

    return (
        <Card className="border-none shadow-md">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Book className="h-5 w-5 text-primary" />
                    Select Programme
                </CardTitle>
                <CardDescription>Choose a programme to view available courses.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-4">
                    <Select value={selectedProgramme} onValueChange={onSelectProgramme}>
                        <SelectTrigger className="h-11">
                            <SelectValue placeholder={isProgrammesLoading ? "Loading..." : "Select Programme"} />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            {odelProgrammes.length > 0 ? (
                                odelProgrammes.map((prog) => (
                                    <SelectItem key={prog.id} value={prog.id.toString()}>
                                        {prog.name}
                                    </SelectItem>
                                ))
                            ) : (
                                !isProgrammesLoading && <div className="p-2 text-sm text-muted-foreground text-center">No ODEL programmes found</div>
                            )}
                        </SelectContent>
                    </Select>

                    {isProgrammesError && (
                        <div className="text-destructive text-sm flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            Failed to load programmes.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default ProgrammeSelector;
