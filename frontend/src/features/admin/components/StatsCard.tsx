import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string;
    change: string;
    changeLabel: string;
    icon: LucideIcon;
    trend: string;
    bgGradient: string;
    iconBg: string;
}

const StatsCard = ({ title, value, change, changeLabel, icon: Icon, trend, bgGradient, iconBg }: StatCardProps) => {
    return (
        <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 group">
            <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-50`} />
            <CardHeader className="relative pb-2">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {title}
                        </p>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-3xl md:text-4xl font-bold">{value}</span>
                            {trend && (
                                <Badge variant="outline" className="gap-1 border-primary/20 bg-primary/10 text-primary">
                                    <TrendingUp className="h-3 w-3" />
                                    {change}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <div className={`${iconBg} p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform`}>
                        <Icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="relative">
                <p className="text-xs text-muted-foreground">{changeLabel}</p>
            </CardContent>
        </Card>
    );
};

export default StatsCard;
