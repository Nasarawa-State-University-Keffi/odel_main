import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, Menu, Search, ChevronDown, Circle } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup, // Add this
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { navItems } from "@/data";

// Extract type from your navItems structure
type NavItemType = typeof navItems[keyof typeof navItems][number];

interface NavBarProps {
    targetNav: any;
}

const MobileNavItem = ({ item, currentPath }: { item: any; currentPath: string }) => {
    const [isOpen, setIsOpen] = useState(currentPath.includes(item.href));
    const hasChildren = item?.children && item.children.length > 0;
    const isActive = currentPath === item.href || (hasChildren && currentPath.includes(item.href));

    if (hasChildren) {
        return (
            <div className="flex flex-col space-y-1">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium transition-colors ${isActive ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <item.icon className={`w-5 h-5 ${isActive ? "text-emerald-500" : "text-zinc-500"}`} />
                        {item.name}
                    </div>
                    <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180 text-zinc-300" : "text-zinc-500"}`}
                    />
                </button>

                {/* Expandable Children Area */}
                <div
                    className={`grid transition-all duration-200 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
                        }`}
                >
                    <div className="overflow-hidden flex flex-col space-y-1 pl-4">
                        {item.children?.map((child: any) => {
                            const isChildActive = currentPath === child.href;
                            return (
                                <Link
                                    key={child.name}
                                    to={child.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors border-l-2 ${isChildActive
                                        ? "border-emerald-500 bg-zinc-900/50 text-white font-medium"
                                        : "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                                        }`}
                                >
                                    <Circle className={`w-1.5 h-1.5 ${isChildActive ? "fill-emerald-500 text-emerald-500" : "fill-transparent"}`} />
                                    {child.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Link
            to={item.href}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${isActive ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                }`}
        >
            <item.icon className={`w-5 h-5 ${isActive ? "text-emerald-500" : "text-zinc-500"}`} />
            {item.name}
        </Link>
    );
};

const NavBar = ({ targetNav }: NavBarProps) => {
    const location = useLocation();

    // Intelligently find the current page name, checking children as well
    let currentPage = "Dashboard";
    for (const item of targetNav) {
        if (location.pathname.includes(item.href)) {
            currentPage = item.name;
            if (item.children) {
                const activeChild = item.children.find((c: any) => location.pathname.includes(c.href));
                if (activeChild) currentPage = activeChild.name;
            }
        }
    }

    return (
        <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 z-30 sticky top-0 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">

            {/* Mobile Menu & Page Title */}
            <div className="flex items-center gap-4">
                {/* Mobile Hamburger Menu */}
                <Sheet>
                    <SheetTrigger>
                        <Button variant="ghost" size="icon" className="lg:hidden shrink-0 hover:bg-zinc-100 dark:hover:bg-zinc-900">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[280px] bg-zinc-950 border-zinc-800 text-zinc-300 p-0 shadow-2xl">
                        <SheetHeader className="h-16 flex items-center justify-center border-b border-zinc-800/50 px-6 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-10">
                            <SheetTitle className="text-white text-lg font-heading tracking-tight flex items-center gap-2">
                                <div className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center">
                                    <span className="text-xs text-white font-bold">LMS</span>
                                </div>
                                Portal Menu
                            </SheetTitle>
                        </SheetHeader>
                        <div className="flex flex-col py-6 px-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-4rem)] custom-scrollbar">
                            {targetNav.map((item: any) => (
                                <MobileNavItem key={item.name} item={item} currentPath={location.pathname} />
                            ))}
                        </div>
                    </SheetContent>
                </Sheet>

                <h1 className="text-xl font-heading font-semibold text-zinc-900 dark:text-zinc-50 hidden sm:block tracking-tight">
                    {currentPage}
                </h1>
            </div>

            {/* Right Side: Search, Notifications, Profile */}
            <div className="flex items-center gap-3 md:gap-5">

                {/* Search Bar */}
                <div className="relative hidden md:block w-64 lg:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-zinc-400" />
                    <Input
                        placeholder="Search courses, assignments..."
                        className="pl-10 h-10 bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-full focus-visible:ring-emerald-500 focus-visible:border-emerald-500 dark:focus-visible:bg-zinc-950 transition-all"
                    />
                </div>

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                    <Bell className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                    <Badge className="absolute top-0 right-0 h-4 w-4 flex items-center justify-center p-0 bg-emerald-500 text-white rounded-full text-[9px] font-bold border-2 border-white dark:border-zinc-950">
                        3
                    </Badge>
                </Button>

                {/* User Profile Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-zinc-200 dark:hover:ring-zinc-800 transition-all p-0">
                            <Avatar className="h-9 w-9 border border-zinc-200 dark:border-zinc-800">
                                <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                                <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">RD</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 mt-1" align="end">
                        {/* Wrap DropdownMenuLabel inside DropdownMenuGroup */}
                        <DropdownMenuGroup>
                            <DropdownMenuLabel className="font-normal p-3">
                                <div className="flex flex-col space-y-1.5">
                                    <p className="text-sm font-semibold leading-none text-zinc-900 dark:text-zinc-100">Richard Dauda</p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-none font-medium">NSUK/2026/001</p>
                                </div>
                            </DropdownMenuLabel>
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator />

                        <DropdownMenuGroup>
                            <DropdownMenuItem className="cursor-pointer">
                                <Link to="/profile">Profile</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">Settings</DropdownMenuItem>
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem className="text-red-600 dark:text-red-500 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-950/50 cursor-pointer">
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
};

export default NavBar;