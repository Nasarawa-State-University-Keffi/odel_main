import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, CheckCircle, Clock, AlertCircle } from "lucide-react";

const RecentActivityList = () => {
    const recentActivity = [
        {
            id: 1,
            name: "Sarah Johnson",
            action: "Application Submitted",
            programme: "Computer Science",
            time: "2 minutes ago",
            status: "pending",
            avatar: "SJ"
        },
        {
            id: 2,
            name: "Michael Chen",
            action: "Application Approved",
            programme: "Business Admin",
            time: "15 minutes ago",
            status: "approved",
            avatar: "MC"
        },
        {
            id: 3,
            name: "Emma Davis",
            action: "Under Review",
            programme: "Engineering",
            time: "1 hour ago",
            status: "review",
            avatar: "ED"
        },
        {
            id: 4,
            name: "James Wilson",
            action: "Documents Uploaded",
            programme: "Public Admin",
            time: "2 hours ago",
            status: "pending",
            avatar: "JW"
        },
        {
            id: 5,
            name: "Olivia Brown",
            action: "Payment Confirmed",
            programme: "Education",
            time: "3 hours ago",
            status: "success",
            avatar: "OB"
        },
    ];

    const getStatusConfig = (status: string) => {
        const configs = {
            pending: { bg: "bg-secondary/10", text: "text-secondary", border: "border-secondary/20", icon: Clock },
            approved: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20", icon: CheckCircle },
            review: { bg: "bg-accent/10", text: "text-accent", border: "border-accent/20", icon: AlertCircle },
            success: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20", icon: CheckCircle },
        };
        return configs[status as keyof typeof configs] || configs.pending;
    };

    return (
        <Card className="lg:col-span-2 shadow-md border-0">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest actions and updates</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className="text-primary">
                        View All
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {recentActivity.map((activity) => {
                        const statusConfig = getStatusConfig(activity.status);
                        const StatusIcon = statusConfig.icon;

                        return (
                            <div
                                key={activity.id}
                                className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 group"
                            >
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0 group-hover:scale-110 transition-transform">
                                    {activity.avatar}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-semibold text-sm truncate">{activity.name}</p>
                                        <Badge variant="outline" className={`${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border} text-xs gap-1`}>
                                            <StatusIcon className="h-3 w-3" />
                                            {activity.action}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <GraduationCap className="h-3 w-3" />
                                        <span className="truncate">{activity.programme}</span>
                                        <span>•</span>
                                        <span className="whitespace-nowrap">{activity.time}</span>
                                    </div>
                                </div>

                                <Button variant="ghost" size="sm" className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    View
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};

export default RecentActivityList;
