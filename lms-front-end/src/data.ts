import {
    LayoutDashboard,
    BookOpen,
    GraduationCap,
    ClipboardCheck,
    FileText,
    File,
    HardDrive,
    Bell,
} from "lucide-react";

export const navItems = {
    admin: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Content", href: "/learning-content", icon: File },
        { name: "Academic Setup", href: "/admin/dashboard/academic-setup", icon: BookOpen },
        { name: "Storage Settings", href: "/admin/dashboard/storage-settings", icon: HardDrive },
         {
           name: "Notifications", href: "/admin/dashboard/notifications/settings", icon: Bell, children: [
                {
                    name: "Configure",
                    href: "/admin/dashboard/notifications/settings",
                },
                {
                    name: "Logs",
                    href: "/admin/dashboard/notifications/logs",
                },
                // {
                //     name: "Quizzes",
                //     href: "/staff/dashboard/quizzes",
                // }
            ]
        },
    ],
    staff: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Content", href: "/learning-content", icon: BookOpen },
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
                // {
                //     name: "Quizzes",
                //     href: "/staff/dashboard/quizzes",
                // }
            ]
        },

        {
            name: "Content", href: "/staff/dashboard/content", icon: File, children: [
                {
                    name: "Upload",
                    href: "/staff/dashboard/content/upload",
                },
            ]
        },
        // {
        //     name: "Question Bank", href: "/staff/dashboard/assessments", icon: FileText, children: [
        //         {
        //             name: "Categories",
        //             href: "/staff/dashboard/question-bank/categories",
        //         },
        //         {
        //             name: "Questions",
        //             href: "/staff/dashboard/question-bank/questions",
        //         },
        //         // {
        //         //     name: "New Questions",
        //         //     href: "/staff/dashboard/question-bank/questions/create",
        //         // },
        //     ]
        // },
    ],
    student: [
        { name: "Dashboard", href: "/student", icon: LayoutDashboard },
        { name: "Content", href: "/learning-content", icon: File},
        { name: "Assignments", href: "/student/assignments", icon: FileText },
    ]
}


