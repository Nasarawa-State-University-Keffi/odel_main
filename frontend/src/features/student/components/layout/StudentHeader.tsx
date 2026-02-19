import { useState, useEffect } from "react";
import apiClient from "@/lib/api";
import { Bell, Menu, LogOut, PanelLeftClose, PanelLeft, UserCircle } from "lucide-react";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/features/admin/components/admission/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/features/admin/components/admission/components/ui/skeleton";

interface StudentHeaderProps {
    onMenuClick: () => void;
    onToggleCollapse: () => void;
    isCollapsed: boolean;
}

const StudentHeader = ({ onMenuClick, onToggleCollapse, isCollapsed }: StudentHeaderProps) => {
    const { data: currentUser, isLoading } = useCurrentUser();

    console.log("this is the current user data", currentUser);
    const { logout } = useAuth();

    const displayName = currentUser?.fullName || currentUser?.username || currentUser?.userId || "Applicant";
    const displayEmail = currentUser?.email || "";
    const userInitials = displayName
        ? displayName
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : "??";

    const [imageObjectUrl, setImageObjectUrl] = useState<string | null>(null);

    useEffect(() => {
        let objectUrl: string | null = null;
        if (currentUser?.profileImage) {
            apiClient.get(currentUser.profileImage, { responseType: 'blob' })
                .then(response => {
                    objectUrl = URL.createObjectURL(response.data);
                    setImageObjectUrl(objectUrl);
                })
                .catch(err => console.error("Failed to load profile image", err));
        }
        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [currentUser?.profileImage]);

    return (
        <header className="sticky top-0 z-30 h-20 border-b border-border/40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 px-6 lg:px-8 flex items-center justify-between transition-all duration-500">
            <div className="flex items-center gap-6">
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/10 active:scale-95 transition-all duration-300"
                    onClick={onMenuClick}
                >
                    <Menu className="h-6 w-6" />
                </Button>

                {/* Desktop Sidebar Toggle */}
                <div className="hidden lg:flex items-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg bg-background/50 border border-border/50 shadow-sm hover:shadow-md hover:bg-primary/10 hover:text-primary hover:border-primary/20 active:scale-95 transition-all duration-300 group"
                        onClick={onToggleCollapse}
                    >
                        {isCollapsed ?
                            <PanelLeft className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" /> :
                            <PanelLeftClose className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                        }
                    </Button>
                </div>

                <div className="flex flex-col select-none">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg md:text-xl font-black tracking-tight text-foreground">
                            NSUK <span className="text-primary">oDEL</span>
                        </h2>
                        <div className="hidden md:block h-4 w-px bg-border/60" />
                        <span className="hidden md:block text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">
                            Student Dashboard
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-5">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative flex items-center gap-3 pl-1 pr-4 py-1 hover:bg-primary/5 h-12 rounded-full border border-transparent hover:border-border/30 transition-all duration-300 group">
                            <div className="relative">
                                {isLoading ? (
                                    <Skeleton className="h-9 w-9 rounded-full shadow-inner" />
                                ) : imageObjectUrl ? (
                                    <img
                                        src={imageObjectUrl}
                                        alt={displayName}
                                        className="h-9 w-9 rounded-full object-cover ring-2 ring-background shadow-md group-hover:ring-primary/20 transition-all"
                                    />
                                ) : (
                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center ring-2 ring-background shadow-md">
                                        <span className="text-xs font-black text-primary-foreground">{userInitials}</span>
                                    </div>
                                )}
                                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 rounded-full border-2 border-background ring-1 ring-background" />
                            </div>
                            <div className="hidden md:flex flex-col items-start gap-0.5 text-left">
                                {isLoading ? (
                                    <>
                                        <Skeleton className="h-3 w-20" />
                                        <Skeleton className="h-2 w-24 opacity-60" />
                                    </>
                                ) : (
                                    <>
                                        <span className="text-sm font-bold leading-none text-foreground/90 group-hover:text-primary transition-colors">{displayName}</span>
                                        <span className="text-[10px] text-muted-foreground leading-none font-medium truncate max-w-[120px]">
                                            {displayEmail}
                                        </span>
                                    </>
                                )}
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-80 p-3 rounded-2xl shadow-2xl border-border/40 bg-background/95 backdrop-blur-xl" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal p-4 bg-muted/40 rounded-xl mb-2 cursor-pointer hover:bg-muted/60 transition-colors border border-transparent hover:border-border/40 group">
                            <div className="flex items-center gap-4">
                                {imageObjectUrl ? (
                                    <img
                                        src={imageObjectUrl}
                                        alt={displayName}
                                        className="h-12 w-12 shrink-0 rounded-full object-cover ring-4 ring-primary/5 group-hover:scale-105 transition-transform"
                                    />
                                ) : (
                                    <div className="h-12 w-12 shrink-0 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/5 group-hover:scale-105 transition-transform">
                                        <span className="text-lg font-black text-primary">{userInitials}</span>
                                    </div>
                                )}
                                <div className="flex flex-col overflow-hidden">
                                    <p className="text-base font-bold leading-none truncate text-foreground">{displayName}</p>
                                    <p className="text-xs leading-tight text-muted-foreground mt-1.5 truncate">
                                        {displayEmail}
                                    </p>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="opacity-40 my-2" />
                        <DropdownMenuItem className="rounded-lg gap-3 py-3 px-3">
                            <UserCircle className="h-4.5 w-4.5 text-muted-foreground" />
                            <span className="text-sm font-semibold">My Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="opacity-40 my-2" />
                        <DropdownMenuItem className="text-destructive rounded-lg gap-3 py-3 px-3 cursor-pointer" onClick={logout}>
                            <LogOut className="h-4.5 w-4.5" />
                            <span className="text-sm font-semibold">Sign Out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
};

export default StudentHeader;
