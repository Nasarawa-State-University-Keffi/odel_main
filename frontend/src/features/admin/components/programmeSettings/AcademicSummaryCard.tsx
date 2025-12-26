import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";

interface AcademicSummaryCardProps {
    totalCourses: number;
    totalCreditUnits: number | undefined;
}

const AcademicSummaryCard = ({ totalCourses, totalCreditUnits }: AcademicSummaryCardProps) => {
    return (
        <Card className="border-0 shadow-xl rounded-3xl overflow-hidden bg-primary/5 border-l-4 border-l-primary">
            <CardContent className="p-6">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <div className="p-1 bg-white rounded-md shadow-sm">
                            <Info className="h-4 w-4 text-primary" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h4 className="font-bold text-slate-800">Academic Summary</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Check all {totalCourses} courses for accuracy.
                            Total Credit Units should align with {totalCreditUnits || 0} units policy.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default AcademicSummaryCard;
