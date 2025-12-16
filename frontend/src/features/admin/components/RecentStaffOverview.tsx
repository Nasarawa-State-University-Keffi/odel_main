
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { staffService } from "../services/staffService";
import { formatDistanceToNow } from "date-fns";

const RecentStaffOverview = () => {
    const { data: staffData, isLoading } = useQuery({
        queryKey: ["staffs", "recent"],
        queryFn: () => staffService.getAllStaffPaginated(0, 5), // Fetch first page, 5 items
        staleTime: 5 * 60 * 1000,
    });

    const recentStaff = staffData?.content || [];

    return (
        <Card className="col-span-1 shadow-md border-0">
            <CardHeader>
                <CardTitle>Recent Staff Members</CardTitle>
                <CardDescription>
                    Newest additions to the team.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    {isLoading ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : recentStaff.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No staff members found.</p>
                    ) : (
                        recentStaff.map((staff) => {
                            // Handle nested user/roles structure if necessary, similar to StaffList
                            const user = (staff as any).user || staff || {};
                            const name = user.name || (user.firstName && `${user.firstName} ${user.lastName}`) || "Unknown";
                            const email = user.email || "No Email";
                            // Ensure roles is an array
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
                                <div key={staff.id || user.id} className="flex items-center">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src="/avatars/01.png" alt="Avatar" />
                                        <AvatarFallback>{initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none truncate max-w-[150px]" title={name}>{name}</p>
                                        <p className="text-xs text-muted-foreground truncate max-w-[150px]" title={email}>
                                            {email}
                                        </p>
                                    </div>
                                    <div className="ml-auto flex flex-col items-end gap-1">
                                        <Badge variant="outline" className="text-[10px] pointer-events-none">
                                            {primaryRole.replace("_", " ")}
                                        </Badge>
                                        {/* If we had creation date, we could show it. Assuming creationTime exists on Staff/User */}
                                        {/* <span className="text-[10px] text-muted-foreground">
                                            {staff.creationTime ? formatDistanceToNow(new Date(staff.creationTime), { addSuffix: true }) : ''}
                                         </span> */}
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
