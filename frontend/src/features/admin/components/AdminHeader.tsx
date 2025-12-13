import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminHeaderProps {
    onMenuClick: () => void;
}

const AdminHeader = ({ onMenuClick }: AdminHeaderProps) => {
    const { data: currentUser, isLoading } = useCurrentUser();
    const { logout } = useAuth();

    const displayName = currentUser?.fullName || currentUser?.username || currentUser?.userId || "Admin User";
    const displayEmail = currentUser?.email || "admin@odel.edu.ng";
    const userInitials = displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <header className="sticky top-0 z-30 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={onMenuClick}
                >
                    <Menu className="h-5 w-5" />
                </Button>
                <h2 className="text-lg font-semibold">OPEN DISTANCE e-LEARNING PORTAL</h2>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-destructive rounded-full" />
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                            {currentUser?.profileImage ? (
                                <img
                                    src={currentUser.profileImage}
                                    alt={displayName}
                                    className="h-9 w-9 rounded-full object-cover"
                                />
                            ) : (
                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                                    {isLoading ? (
                                        <Skeleton className="h-4 w-4 rounded-full" />
                                    ) : (
                                        <span className="text-xs font-semibold text-primary">{userInitials}</span>
                                    )}
                                </div>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                {isLoading ? (
                                    <>
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-40 mt-1" />
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm font-medium leading-none">{displayName}</p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {displayEmail}
                                        </p>
                                        {currentUser?.roles && (
                                            <p className="text-xs leading-none text-primary mt-1">
                                                {currentUser.roles.join(', ')}
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Profile</DropdownMenuItem>
                        <DropdownMenuItem>Settings</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive"
                            onClick={logout}
                        >
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
};

export default AdminHeader;
