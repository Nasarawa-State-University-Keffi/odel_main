import { Link, useLocation } from "react-router-dom";
import { Bell, Menu, Search } from "lucide-react";
import { navItems } from "./SideBar";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const NavBar = () => {
    const location = useLocation();

    // Get the current page name for the header title
    const currentPage = navItems.find(item => location.pathname.includes(item.href))?.name || "Dashboard";

    return (
        <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 z-30 sticky top-0">

            {/* Mobile Menu & Page Title */}
            <div className="flex items-center gap-4">
                {/* Mobile Hamburger Menu (Hidden on Desktop) */}
                <Sheet>
                    {/* FIX: Removed asChild prop */}
                    <SheetTrigger>
                        <Button variant="ghost" size="icon" className="lg:hidden shrink-0">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72 bg-zinc-950 border-zinc-900 text-zinc-300 p-0">
                        <SheetHeader className="h-16 flex items-center justify-center border-b border-zinc-900/50 px-6">
                            <SheetTitle className="text-white text-lg flex items-center gap-2">
                                LMS Portal Menu
                            </SheetTitle>
                        </SheetHeader>
                        <div className="flex flex-col py-6 px-3 space-y-1">
                            {navItems.map((item) => (
                                <Link key={item.name} to={item.href} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium hover:bg-zinc-900 hover:text-white transition-colors">
                                    <item.icon className="w-5 h-5 text-zinc-400" />
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </SheetContent>
                </Sheet>

                <h1 className="text-xl font-heading font-semibold text-zinc-900 dark:text-zinc-50 hidden sm:block">
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
                        className="pl-10 h-10 bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-full focus-visible:ring-emerald-500 focus-visible:bg-white transition-all"
                    />
                </div>

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative rounded-full">
                    <Bell className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-emerald-500 text-white rounded-full text-[10px]">
                        3
                    </Badge>
                </Button>

                {/* User Profile Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                            <Avatar className="h-9 w-9 border border-zinc-200 dark:border-zinc-800">
                                <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                                <AvatarFallback>RD</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    {/* FIX: Removed forceMount prop */}
                    <DropdownMenuContent className="w-56" align="end">
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">Richard Dauda</p>
                                <p className="text-xs text-muted-foreground leading-none">NSUK/2026/001</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Profile</DropdownMenuItem>
                        <DropdownMenuItem>Settings</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-500">Log out</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
};

export default NavBar;