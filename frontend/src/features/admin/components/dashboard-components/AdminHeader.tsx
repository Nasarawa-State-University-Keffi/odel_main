import { useState } from "react";
import { Bell, Menu, LogOut, PanelLeftClose, PanelLeft, UserCircle } from "lucide-react";
import UserProfileModal from "./UserProfileModal";
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

interface AdminHeaderProps {
    onMenuClick: () => void;
    onToggleCollapse: () => void;
    isCollapsed: boolean;
}

const AdminHeader = ({ onMenuClick, onToggleCollapse, isCollapsed }: AdminHeaderProps) => {
    const { data: currentUser, isLoading } = useCurrentUser();
    const { logout } = useAuth();
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const displayName = currentUser?.fullName || currentUser?.username || currentUser?.userId || "";
    const displayEmail = currentUser?.email || "";
    const userInitials = displayName
        ? displayName
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : "??";

    return (
        <>
            <UserProfileModal
                user={currentUser}
                open={isProfileModalOpen}
                onOpenChange={setIsProfileModalOpen}
            />

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
                                oDEL <span className="text-primary">PORTAL</span>
                            </h2>
                            <div className="hidden md:block h-4 w-px bg-border/60" />
                            <span className="hidden md:block text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">
                                Administration
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 md:gap-5">


                    <div className="h-8 w-[1px] bg-border/40 mx-2 hidden md:block" />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative flex items-center gap-3 pl-1 pr-4 py-1 hover:bg-primary/5 h-12 rounded-full border border-transparent hover:border-border/30 transition-all duration-300 group">
                                <div className="relative">
                                    {isLoading ? (
                                        <Skeleton className="h-9 w-9 rounded-full shadow-inner" />
                                    ) : currentUser?.profileImage ? (
                                        <img
                                            src={currentUser.profileImage}
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
                                <div className="hidden md:flex flex-col items-start gap-0.5">
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
                            <DropdownMenuLabel className="font-normal p-4 bg-muted/40 rounded-xl mb-2 cursor-pointer hover:bg-muted/60 transition-colors border border-transparent hover:border-border/40 group" onClick={() => setIsProfileModalOpen(true)}>
                                <div className="flex flex-col space-y-3">
                                    {isLoading ? (
                                        <>
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-3 w-full opacity-60" />
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 shrink-0 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/5 group-hover:scale-105 transition-transform">
                                                    <span className="text-lg font-black text-primary">{userInitials}</span>
                                                </div>
                                                <div className="flex flex-col overflow-hidden">
                                                    <p className="text-base font-bold leading-none truncate text-foreground">{displayName}</p>
                                                    <p className="text-xs leading-tight text-muted-foreground mt-1.5 truncate">
                                                        {displayEmail}
                                                    </p>
                                                </div>
                                            </div>
                                            {currentUser?.roles && (
                                                <div className="flex flex-wrap gap-1.5 pt-1">
                                                    {currentUser.roles.slice(0, 3).map((role) => (
                                                        <span key={role} className="text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2.5 py-1 rounded-md border border-primary/20">
                                                            {role}
                                                        </span>
                                                    ))}
                                                    {currentUser.roles.length > 3 && (
                                                        <span className="text-[9px] font-bold bg-muted text-muted-foreground px-2 py-1 rounded-md border border-border/50">+{currentUser.roles.length - 3}</span>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </DropdownMenuLabel>

                            <DropdownMenuSeparator className="opacity-40 my-2" />

                            <div className="p-1 space-y-1">
                                <DropdownMenuItem
                                    className="rounded-lg gap-3 cursor-pointer focus:bg-primary/5 py-3 px-3 transition-colors"
                                    onClick={() => setIsProfileModalOpen(true)}
                                >
                                    <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 border border-blue-500/10">
                                        <UserCircle className="h-4.5 w-4.5" />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-sm font-semibold">My Profile</span>
                                        <span className="text-[10px] text-muted-foreground font-medium">Manage account settings</span>
                                    </div>
                                </DropdownMenuItem>
                            </div>

                            <DropdownMenuSeparator className="opacity-40 my-2" />

                            <div className="p-1">
                                <DropdownMenuItem
                                    className="text-destructive focus:bg-destructive/5 focus:text-destructive rounded-lg gap-3 cursor-pointer font-semibold py-3 px-3 transition-colors"
                                    onClick={logout}
                                >
                                    <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center border border-destructive/10">
                                        <LogOut className="h-4.5 w-4.5" />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-sm font-semibold">Sign Out</span>
                                        <span className="text-[10px] text-muted-foreground/80 font-medium">End your session</span>
                                    </div>
                                </DropdownMenuItem>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
        </>
    );
};

export default AdminHeader;

