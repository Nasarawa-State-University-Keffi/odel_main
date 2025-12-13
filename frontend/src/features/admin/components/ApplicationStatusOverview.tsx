import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react";

const ApplicationStatusOverview = () => {
    const stats = [
        { label: "Approved", value: "2,156", icon: CheckCircle, color: "text-primary" },
        { label: "Pending", value: "145", icon: Clock, color: "text-secondary" },
        { label: "Under Review", value: "87", icon: AlertCircle, color: "text-accent" },
        { label: "Rejected", value: "155", icon: XCircle, color: "text-destructive" },
    ];

    return (
        <Card className="shadow-md border-0">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl">Application Status Overview</CardTitle>
                        <CardDescription>Current semester statistics</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                        View Details
                        <ArrowUpRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="p-2 rounded-lg bg-background">
                                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stat.value}</p>
                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default ApplicationStatusOverview;
