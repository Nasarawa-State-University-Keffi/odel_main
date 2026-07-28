import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  GraduationCap,
  Settings,
  LogOut,
  ChevronDown,
  Circle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";

// 1. Updated Schema to include children
const navChildSchema = z.object({
  name: z.string(),
  href: z.string(),
});
``
const navSchema = z.object({
  name: z.string(),
  href: z.string(),
  icon: z.any(),
  children: z.array(navChildSchema).optional(),
});

type NavItemType = z.infer<typeof navSchema>;

// 2. Extracted NavItem Component to handle collapsible logic & states
const DesktopNavItem = ({ item, currentPath }: { item: NavItemType; currentPath: string }) => {
  const hasChildren = item.children && item.children.length > 0;

  // Check if this item or any of its children are active
  const isDirectlyActive = currentPath === item.href || (currentPath === '/' && item.name === 'Dashboard');
  const isChildActive = hasChildren ? item.children!.some(child => currentPath.includes(child.href)) : false;
  const isActive = isDirectlyActive || isChildActive;

  // Auto-expand if a child is active
  const [isOpen, setIsOpen] = useState(isActive);

  // Keep open state synced if URL changes externally
  useEffect(() => {
    if (isChildActive) setIsOpen(true);
  }, [isChildActive]);

  if (hasChildren) {
    return (
      <div className="flex flex-col space-y-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group w-full outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50",
            isActive
              ? "bg-zinc-900/80 text-white"
              : "text-zinc-400 hover:bg-zinc-900/50 hover:text-white"
          )}
        >
          <div className="flex items-center gap-4">
            <item.icon className={cn(
              "w-5 h-5 transition-transform duration-200",
              isActive ? "text-emerald-500" : "text-zinc-500 group-hover:text-zinc-400 group-hover:scale-110"
            )} />
            {item.name}
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform duration-300",
              isOpen ? "rotate-180 text-zinc-300" : "text-zinc-600 group-hover:text-zinc-400",
              isActive && !isOpen && "text-emerald-500"
            )}
          />
        </button>

        {/* Animated Expandable Children Area */}
        <div
          className={cn(
            "grid transition-all duration-300 ease-in-out",
            isOpen ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden flex flex-col space-y-1 pl-[22px]">
            <div className="pl-4 border-l border-zinc-800 space-y-1 py-1">
              {item.children?.map((child) => {
                const childActive = currentPath === child.href;
                return (
                  <Link
                    key={child.name}
                    replace
                    to={child.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50",
                      childActive
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "text-zinc-500 hover:bg-zinc-900/80 hover:text-zinc-200"
                    )}
                  >
                    <Circle className={cn(
                      "w-1.5 h-1.5 transition-colors duration-200",
                      childActive ? "fill-emerald-500 text-emerald-500" : "fill-transparent text-zinc-600 group-hover:text-zinc-400"
                    )} />
                    {child.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular single link
  return (
    <Link
      replace
      to={item.href}
      className={cn(
        "flex items-center gap-4 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50",
        isActive
          ? "bg-emerald-500/10 text-emerald-400"
          : "text-zinc-400 hover:bg-zinc-900/50 hover:text-white"
      )}
    >
      <item.icon className={cn(
        "w-5 h-5 transition-transform duration-200",
        isActive ? "text-emerald-500" : "text-zinc-500 group-hover:text-zinc-400 group-hover:scale-110"
      )} />
      {item.name}
    </Link>
  );
};

// 3. Main SideBar Component
const SideBar: React.FC<{ navItems: NavItemType[] }> = ({ navItems }) => {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-72 h-screen bg-zinc-950 text-zinc-300 border-r border-zinc-900 transition-all duration-300 select-none">

      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-zinc-900/50 shrink-0 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3 text-lg font-bold tracking-tight text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 shadow-lg shadow-emerald-500/20">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          LMS Portal
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-1.5 custom-scrollbar">
        <div className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest mb-4 px-3">
          Learning
        </div>
        {navItems.map((item) => (
          <DesktopNavItem key={item.name} item={item} currentPath={location.pathname} />
        ))}
      </nav>

      {/* Bottom Settings/Logout Section */}
      <div className="p-4 border-t border-zinc-900/50 space-y-1.5 shrink-0 bg-zinc-950">
        <Link
          to="/settings"
          className="flex items-center gap-4 px-3 py-3 rounded-xl text-sm font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all duration-200 group"
        >
          <Settings className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300 group-hover:rotate-45 transition-transform duration-300" />
          Settings
        </Link>
        <button
          className="w-full flex items-center gap-4 px-3 py-3 rounded-xl text-sm font-semibold text-red-500/80 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default SideBar;