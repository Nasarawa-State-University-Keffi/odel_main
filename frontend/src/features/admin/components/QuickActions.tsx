import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Users, GraduationCap, BarChart3 } from "lucide-react";

const QuickActions = () => {
    const actions = [
        {
            icon: FileText,
            title: "Review Apps",
            subtitle: "145 pending",
            hoverBg: "hover:bg-primary/5",
            hoverBorder: "hover:border-primary",
            hoverText: "hover:text-primary",
            iconBg: "bg-primary/10",
            iconHoverBg: "group-hover:bg-primary",
        },
        {
            icon: Users,
            title: "Manage Users",
            subtitle: "2,543 total",
            hoverBg: "hover:bg-secondary/5",
            hoverBorder: "hover:border-secondary",
            hoverText: "hover:text-secondary",
            iconBg: "bg-secondary/10",
            iconHoverBg: "group-hover:bg-secondary",
        },
        {
            icon: GraduationCap,
            title: "Programs",
            subtitle: "12 active",
            hoverBg: "hover:bg-accent/5",
            hoverBorder: "hover:border-accent",
            hoverText: "hover:text-accent",
            iconBg: "bg-accent/10",
            iconHoverBg: "group-hover:bg-accent",
        },
        {
            icon: BarChart3,
            title: "Analytics",
            subtitle: "View insights",
            hoverBg: "hover:bg-primary/5",
            hoverBorder: "hover:border-primary",
            hoverText: "hover:text-primary",
            iconBg: "bg-primary/10",
            iconHoverBg: "group-hover:bg-primary",
        },
    ];

    return (
        <Card className="shadow-md border-0">
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Frequently used tools and functions</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {actions.map((action, idx) => (
                        <Button
                            key={idx}
                            variant="outline"
                            className={`h-auto flex-col gap-3 py-6 ${action.hoverBg} ${action.hoverBorder} ${action.hoverText} transition-all group`}
                        >
                            <div className={`p-3 rounded-xl ${action.iconBg} ${action.iconHoverBg} group-hover:text-primary-foreground transition-colors`}>
                                <action.icon className="h-6 w-6" />
                            </div>
                            <div className="text-center">
                                <p className="font-semibold text-sm">{action.title}</p>
                                <p className="text-xs text-muted-foreground">{action.subtitle}</p>
                            </div>
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default QuickActions;
