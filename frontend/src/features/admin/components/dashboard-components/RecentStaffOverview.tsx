
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { staffService } from "../../services/staffService";
import { formatDistanceToNow } from "date-fns";

import { Skeleton } from "@/components/ui/skeleton";

const RecentStaffOverview = () => {
    const { data: staffData, isLoading } = useQuery({
        queryKey: ["staffs", "recent"],
        queryFn: () => staffService.getAllStaffPaginated(0, 5),
        staleTime: 5 * 60 * 1000,
    });

    const recentStaff = staffData?.content || [];

    return (
        <Card className="col-span-1 shadow-md border-0 bg-background/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-xl font-bold tracking-tight">Recent Staff</CardTitle>
                <CardDescription className="text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
                    Latest onboarding additions
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-3 w-3/4" />
                                </div>
                            </div>
                        ))
                    ) : recentStaff.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">No staff members found.</p>
                    ) : (
                        recentStaff.map((staff) => {
                            const user = (staff as any).user || staff || {};
                            const name = user.name || (user.firstName && `${user.firstName} ${user.lastName}`) || "Unknown";
                            const email = user.email || "No Email";
                            const roles = Array.isArray(user.roles) ? user.roles : [];
                            const primaryRole = roles.length > 0
                                ? (typeof roles[0] === 'string' ? roles[0] : roles[0].name)
                                : "No Role";

                            const initials = name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2);

                            return (
                                <div key={staff.id || user.id} className="flex items-center group cursor-pointer">
                                    <Avatar className="h-10 w-10 border-2 border-primary/10 transition-transform group-hover:scale-110">
                                        <AvatarImage src={user.profileImage} alt={name} />
                                        <AvatarFallback className="bg-primary/5 text-primary text-xs font-black">{initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="ml-4 space-y-0.5 flex-1 min-w-0">
                                        <p className="text-sm font-bold leading-none truncate group-hover:text-primary transition-colors" title={name}>{name}</p>
                                        <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter" title={email}>
                                            {email}
                                        </p>
                                    </div>
                                    <div className="ml-2 flex flex-col items-end gap-1">
                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter border-primary/20 bg-primary/5 text-primary py-0.5 whitespace-nowrap">
                                            {primaryRole.replace("_", " ")}
                                        </Badge>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    );
};


export default RecentStaffOverview;
