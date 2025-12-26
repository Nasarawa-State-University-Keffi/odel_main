import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, CheckCircle, Clock, AlertCircle, LogOut } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
interface RecentActivityListProps {
    isLoading?: boolean;
}

const RecentActivityList = ({ isLoading }: RecentActivityListProps) => {
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
        <Card className="lg:col-span-2 shadow-md border-0 bg-background/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold tracking-tight">Recent Activity</CardTitle>
                        <CardDescription className="text-xs font-medium uppercase tracking-widest text-muted-foreground/60">Live feed from all modules</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className="text-primary font-bold text-xs uppercase tracking-wider hover:bg-primary/5 rounded-xl">
                        View History
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/20">
                                <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-1/3" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                        ))
                    ) : (
                        recentActivity.map((activity) => {
                            const statusConfig = getStatusConfig(activity.status);
                            const StatusIcon = statusConfig.icon;

                            return (
                                <div
                                    key={activity.id}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-all duration-300 group border border-transparent hover:border-primary/5"
                                >
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary text-xs font-black flex-shrink-0 group-hover:scale-110 transition-all duration-300 shadow-sm border border-primary/10">
                                        {activity.avatar}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                            <p className="font-bold text-sm truncate text-foreground/90">{activity.name}</p>
                                            <Badge variant="outline" className={`${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border} text-[10px] font-bold uppercase tracking-tighter gap-1 px-2 rounded-lg`}>
                                                <StatusIcon className="h-2.5 w-2.5" />
                                                {activity.action}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            <GraduationCap className="h-3 w-3 text-primary/60" />
                                            <span className="truncate">{activity.programme}</span>
                                            <span className="opacity-30">•</span>
                                            <span className="whitespace-nowrap opacity-70">{activity.time}</span>
                                        </div>
                                    </div>

                                    <Button variant="ghost" size="sm" className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl hover:bg-primary/10 text-primary font-bold text-[10px] uppercase">
                                        Details
                                    </Button>
                                </div>
                            );
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default RecentActivityList;

