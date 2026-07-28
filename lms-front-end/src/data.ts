import {
    LayoutDashboard,
    BookOpen,
    GraduationCap,
    ClipboardCheck,
    FileText,
} from "lucide-react";

export const navItems = {
    admin: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "All Courses", href: "/courses", icon: BookOpen },
        { name: "Academic Setup", href: "/admin/dashboard/academic-setup", icon: BookOpen },
        { name: "Assignments", href: "/admin/dashboard/assignments", icon: FileText },
        { name: "Quizzes", href: "/quizzes", icon: ClipboardCheck },
        { name: "My Grades", href: "/grades", icon: GraduationCap },
    ],
    staff: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "All Courses", href: "/courses", icon: BookOpen },
        { name: "Content", href: "/admin/dashboard/academic-setup", icon: BookOpen },
        { name: "Assignments", href: "/staff/dashboard/assignments", icon: FileText },
        { name: "Quizzes", href: "/quizzes", icon: ClipboardCheck },
        { name: "My Grades", href: "/grades", icon: GraduationCap },
        { name: "Assessment Submissions", href: "/staff/dashboard/assessment-submissions", icon: FileText, children: [
            {
                name: "Assignments",
                href: "/staff/dashboard/assessment-submissions/assignments",
            },
            {
                name: "Submissions",
                href: "/staff/dashboard/assessment-submissions/submissions",
            },
            {
                name: "Quizzes",
                href: "/staff/dashboard/assessment-submissions/quizzes",
            }
        ] },
    ],
    student: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "All Courses", href: "/courses", icon: BookOpen },
        { name: "Content", href: "/admin/dashboard/academic-setup", icon: BookOpen },
        { name: "Assignments", href: "/assignments", icon: FileText },
        { name: "Quizzes", href: "/quizzes", icon: ClipboardCheck },
        { name: "My Grades", href: "/grades", icon: GraduationCap },
    ]
}


