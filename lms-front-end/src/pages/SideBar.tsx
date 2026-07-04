import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  BookOpen, 
  GraduationCap, 
  ClipboardCheck, 
  FileText,
  Settings,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

export const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "All Courses", href: "/courses", icon: BookOpen },
  { name: "Content", href: "/content", icon: BookOpen },
  { name: "Assignments", href: "/assignments", icon: FileText },
  { name: "Quizzes", href: "/quizzes", icon: ClipboardCheck },
  { name: "My Grades", href: "/grades", icon: GraduationCap },
];

const SideBar = () => {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-zinc-950 text-zinc-300 border-r border-zinc-900 transition-all duration-300">
      
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-zinc-900/50 shrink-0">
        <div className="flex items-center gap-3 text-lg font-bold tracking-tight text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 shadow-lg shadow-emerald-500/20">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          LMS Portal
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-2">
        <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 px-2">
          Learning
        </div>
        {navItems.map((item) => {
          // Improved active logic: Handles exact matches or root redirects
          const isActive = location.pathname === item.href || (location.pathname === '/' && item.name === 'Dashboard');
          
          return (
            <Link
              key={item.name}
              to={'/application/' + item.href}
              className={cn(
                "flex items-center gap-4 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group",
                isActive 
                  ? "bg-emerald-500/10 text-emerald-400" 
                  : "hover:bg-zinc-900 hover:text-white"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-transform duration-200",
                isActive ? "text-emerald-500" : "text-zinc-500 group-hover:text-zinc-300 group-hover:scale-110"
              )} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Settings/Logout Section */}
      <div className="p-4 border-t border-zinc-900/50 space-y-2 shrink-0">
        <Link to="/settings" className="flex items-center gap-4 px-3 py-3 rounded-xl text-sm font-semibold hover:bg-zinc-900 hover:text-white transition-all duration-200 group">
          <Settings className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300 group-hover:rotate-45 transition-transform" />
          Settings
        </Link>
        <button className="w-full flex items-center gap-4 px-3 py-3 rounded-xl text-sm font-semibold hover:bg-red-500/10 text-red-400/80 hover:text-red-500 transition-all duration-200 group">
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default SideBar;