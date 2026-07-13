import {
    LayoutDashboard,
    BookOpen,
    GraduationCap,
    ClipboardCheck,
    FileText,
} from "lucide-react";

export const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "All Courses", href: "/courses", icon: BookOpen },
    { name: "Content", href: "/admin/dashboard/academic-setup", icon: BookOpen },
    { name: "Assignments", href: "/assignments", icon: FileText },
    { name: "Quizzes", href: "/quizzes", icon: ClipboardCheck },
    { name: "My Grades", href: "/grades", icon: GraduationCap },
];
