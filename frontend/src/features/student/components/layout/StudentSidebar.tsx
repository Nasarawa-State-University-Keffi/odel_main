import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    LogOut,
    FileText,
    User,
    CreditCard,
    Settings,
    FileUp,
    ScrollText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/features/admin/components/admission/components/ui/tooltip";

import odelLogo from '@/assets/nsuk-logo.jpg'
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
    isOpen: boolean;
    isCollapsed: boolean;
    onClose: () => void;
    onToggleCollapse: () => void;
}

const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/student/dashboard" },
    { icon: ScrollText, label: "Application", href: "/student/application" }
];

const StudentSidebar = ({ isOpen, isCollapsed, onClose, onToggleCollapse }: SidebarProps) => {
    const location = useLocation();
    const { logout } = useAuth();

    return (
        <TooltipProvider delayDuration={0}>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed lg:sticky top-0 left-0 h-screen bg-[#01402c] border-r border-white/10 flex flex-col z-50 shadow-2xl lg:shadow-none transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] rounded-r-[30px]",
                    isCollapsed && !isOpen ? "lg:w-[80px]" : "w-[280px]",
                    isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* Header/Logo Section */}
                <div className={cn(
                    "flex items-center transition-all duration-500 ease-in-out px-6 py-8",
                    isCollapsed && !isOpen ? "justify-center px-2" : "justify-between",
                )}>
                    <div className={cn(
                        "flex items-center gap-3 transition-all duration-500",
                        isCollapsed && !isOpen ? "scale-90" : "scale-100"
                    )}>
                        <img
                            src={odelLogo}
                            alt="ODEL Logo"
                            className={cn(
                                "relative rounded-xl object-cover border-2 border-background shadow-sm transition-all duration-500",
                                isCollapsed && !isOpen ? "h-10 w-10" : "h-12 w-12"
                            )}
                        />
                        <div className={cn(
                            "flex flex-col transition-all duration-500 overflow-hidden",
                            isCollapsed && !isOpen ? "w-0 opacity-0" : "w-auto opacity-100"
                        )}>
                            <span className="font-black text-xl tracking-tighter text-white leading-none">NSUK oDEL</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/90 leading-none mt-1">APPLICANT</span>
                        </div>
                    </div>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto custom-scrollbar">
                    {sidebarItems.map((item) => {
                        const isActive = location.pathname === item.href;
                        const navItem = (
                            <Link
                                key={item.href}
                                to={item.href}
                                onClick={() => onClose()}
                                className={cn(
                                    "flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                                    isCollapsed && !isOpen ? "justify-center" : "",
                                    isActive
                                        ? "bg-white/20 text-white shadow-lg shadow-black/5"
                                        : "text-white/70 hover:text-white hover:bg-white/10"
                                )}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-0 h-full w-1 bg-white rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                                )}
                                <item.icon className={cn(
                                    "h-5 w-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110",
                                    isActive ? "text-white" : "text-white/60 group-hover:text-white"
                                )} />
                                <span className={cn(
                                    "font-bold text-sm whitespace-nowrap transition-all duration-500 origin-left",
                                    (!isCollapsed || isOpen)
                                        ? "opacity-100 translate-x-0 w-auto"
                                        : "opacity-0 -translate-x-4 w-0 overflow-hidden"
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        );

                        if (isCollapsed && !isOpen) {
                            return (
                                <Tooltip key={item.href}>
                                    <TooltipTrigger asChild>
                                        {navItem}
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="font-bold border-none bg-white text-[#01402c] px-3 py-1.5 rounded-lg shadow-xl translate-x-1">
                                        {item.label}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        }
                        return navItem;
                    })}
                </nav>

                {/* Footer Section */}
                <div className="p-4 mt-auto">
                    <div className={cn(
                        "bg-gradient-to-br from-black/10 to-transparent rounded-2xl p-4 border border-white/10 transition-all duration-500 overflow-hidden",
                        isCollapsed && !isOpen ? "opacity-0 scale-90 h-0 p-0 pointer-events-none" : "opacity-100"
                    )}>
                        <Button
                            variant="outline"
                            className="w-full h-9 rounded-xl border-white/20 bg-transparent text-white/80 hover:bg-white/10 hover:text-white transition-all font-bold text-xs"
                            onClick={logout}
                        >
                            <LogOut className="h-3.5 w-3.5 mr-2" />
                            Sign Out
                        </Button>
                    </div>

                    {isCollapsed && !isOpen && (
                        <div className="flex flex-col items-center gap-4">
                            <button
                                className="flex items-center justify-center p-3 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all duration-300"
                                onClick={logout}
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                </div>
            </aside>
        </TooltipProvider >
    );
};

export default StudentSidebar;
