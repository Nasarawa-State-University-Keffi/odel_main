import { Card, CardContent } from "@/features/admin/components/admission/components/ui/card";
import { LucideIcon } from "lucide-react";

interface ParameterCardProps {
    label: string;
    value: any;
    icon: LucideIcon;
    color: "blue" | "amber" | "purple" | "emerald";
}

const ParameterCard = ({ label, value, icon: Icon, color }: ParameterCardProps) => {
    const colorClasses: Record<string, string> = {
        blue: "text-blue-600 bg-blue-50/50 border-blue-100",
        amber: "text-amber-600 bg-amber-50/50 border-amber-100",
        purple: "text-purple-600 bg-purple-50/50 border-purple-100",
        emerald: "text-emerald-600 bg-emerald-50/50 border-emerald-100",
    };

    return (
        <Card className={`border shadow-sm rounded-2xl overflow-hidden transition-all hover:shadow-md ${colorClasses[color]}`}>
            <CardContent className="p-5 flex items-center gap-4">
                <div className={`p-2.5 rounded-xl border ${colorClasses[color]} bg-white shadow-inner`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5">{label}</p>
                    <p className="text-xl font-black text-slate-900">{value ?? 'N/A'}</p>
                </div>
            </CardContent>
        </Card>
    );
};

export default ParameterCard;
