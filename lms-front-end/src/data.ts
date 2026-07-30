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
       // { name: "Assignments", href: "/staff/dashboard/assignments", icon: FileText },
        { name: "Quizzes", href: "/quizzes", icon: ClipboardCheck },
        { name: "My Grades", href: "/grades", icon: GraduationCap },
        {
            name: "Assessment", href: "/staff/dashboard/assessments", icon: FileText, children: [
                {
                    name: "Assignments",
                    href: "/staff/dashboard/assignments",
                },
                {
                    name: "Submissions",
                    href: "/staff/dashboard/assessment-submissions/submissions",
                },
                {
                    name: "Quizzes",
                    href: "/staff/dashboard/quizzes",
                }
            ]
        },
         {
            name: "Question Bank", href: "/staff/dashboard/assessments", icon: FileText, children: [
                {
                    name: "Categories",
                    href: "/staff/dashboard/question-bank/categories",
                },
                {
                    name: "Submissions",
                    href: "/staff/dashboard/assessment-submissions/submissions",
                },
                {
                    name: "Quizzes",
                    href: "/staff/dashboard/quizzes",
                }
            ]
        },
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


