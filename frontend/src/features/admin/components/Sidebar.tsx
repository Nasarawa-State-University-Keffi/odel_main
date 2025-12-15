import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, UserCog, Settings, LogOut, FileText, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import odelLogo from '@/assets/nsuk-logo.jpg'
import { useAuth } from "@/contexts/AuthContext";



interface SidebarProps {
    isOpen: boolean;
    isCollapsed: boolean;
    onClose: () => void;
    onToggleCollapse: () => void;
}

const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/api/admin/dashboard" },
    // { icon: Users, label: "Users", href: "/api/admin/users" },
    { icon: UserCog, label: "Staffs", href: "/api/admin/dashboard/staffs" },
    // { icon: FileText, label: "Applications", href: "/api/admin/applications" },
    // { icon: Settings, label: "Settings", href: "/api/admin/settings" },
];

const Sidebar = ({ isOpen, isCollapsed, onClose, onToggleCollapse }: SidebarProps) => {
    const location = useLocation();

    // handles user logout
    const { logout } = useAuth();

    return (
        <TooltipProvider delayDuration={0}>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed lg:sticky top-0 left-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col z-50 transition-all duration-500 ease-in-out",
                    isCollapsed && !isOpen ? "lg:w-20" : "w-64",
                    isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* Header */}
                <div className={cn(
                    "border-b border-sidebar-border flex items-center transition-all duration-500 ease-in-out",
                    isCollapsed && !isOpen ? "flex-col justify-center py-4 gap-2" : "justify-between p-6",
                    "min-h-[73px]"
                )}>
                    <div className={cn(
                        "inline-flex items-center justify-center transition-all duration-500 ease-in-out",
                        isCollapsed && !isOpen ? "" : "mb-4"
                    )}>
                        <img
                            src={odelLogo}
                            alt="ODEL Logo"
                            className={cn(
                                "rounded-full transition-all duration-500 ease-in-out",
                                isCollapsed && !isOpen ? "h-10 w-10" : "h-16"
                            )}
                        />

                    </div>


                    {/* Desktop collapse toggle - only show when not mobile open */}
                    {!isOpen && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="hidden lg:flex"
                            onClick={onToggleCollapse}
                        >
                            {isCollapsed ? (
                                <ChevronRight className="h-5 w-5" />
                            ) : (
                                <ChevronLeft className="h-5 w-5" />
                            )}
                        </Button>
                    )}

                    {/* Mobile close button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={onClose}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {sidebarItems.map((item) => {
                        const isActive = location.pathname === item.href;
                        const navItem = (
                            <Link
                                key={item.href}
                                to={item.href}
                                onClick={() => onClose()}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                                    isCollapsed && !isOpen ? "justify-center" : "",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-md"
                                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                )}
                            >
                                <item.icon className="h-5 w-5 flex-shrink-0" />
                                <span className={cn(
                                    "font-medium whitespace-nowrap transition-all duration-500 ease-in-out origin-left",
                                    (!isCollapsed || isOpen)
                                        ? "opacity-100 translate-x-0 w-auto"
                                        : "opacity-0 -translate-x-2 w-0 overflow-hidden"
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        );

                        // Show tooltip only when collapsed on desktop
                        if (isCollapsed && !isOpen) {
                            return (
                                <Tooltip key={item.href}>
                                    <TooltipTrigger asChild>
                                        {navItem}
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="font-medium">
                                        {item.label}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        }

                        return navItem;
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-sidebar-border">
                    {isCollapsed && !isOpen ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    className="flex items-center justify-center w-full px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                                    onClick={() => {
                                        window.location.href = "/admin/login";
                                    }}
                                >
                                    <LogOut className="h-5 w-5 flex-shrink-0" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="font-medium">
                                Logout
                            </TooltipContent>
                        </Tooltip>
                    ) : (
                        <Button
                            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                            onClick={logout}
                        >
                            <LogOut className="h-5 w-5 flex-shrink-0" />
                            <span className={cn(
                                "font-medium whitespace-nowrap transition-all duration-500 ease-in-out origin-left",
                                (!isCollapsed || isOpen)
                                    ? "opacity-100 translate-x-0 w-auto"
                                    : "opacity-0 -translate-x-2 w-0 overflow-hidden"
                            )}>
                                Logout
                            </span>
                        </Button>
                    )}
                </div>
            </aside>
        </TooltipProvider>
    );
};

export default Sidebar;
