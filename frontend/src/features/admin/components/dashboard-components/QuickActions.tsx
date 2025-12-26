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
            hoverBorder: "hover:border-primary/20",
            hoverText: "hover:text-primary",
            iconBg: "bg-primary/10",
            iconHoverBg: "group-hover:bg-primary",
            color: "text-primary"
        },
        {
            icon: Users,
            title: "Manage Users",
            subtitle: "2,543 total",
            hoverBg: "hover:bg-secondary/5",
            hoverBorder: "hover:border-secondary/20",
            hoverText: "hover:text-secondary",
            iconBg: "bg-secondary/10",
            iconHoverBg: "group-hover:bg-secondary",
            color: "text-secondary"
        },
        {
            icon: GraduationCap,
            title: "Programs",
            subtitle: "12 active",
            hoverBg: "hover:bg-accent/5",
            hoverBorder: "hover:border-accent/20",
            hoverText: "hover:text-accent",
            iconBg: "bg-accent/10",
            iconHoverBg: "group-hover:bg-accent",
            color: "text-accent"
        },
        {
            icon: BarChart3,
            title: "Analytics",
            subtitle: "View insights",
            hoverBg: "hover:bg-primary/5",
            hoverBorder: "hover:border-primary/20",
            hoverText: "hover:text-primary",
            iconBg: "bg-primary/10",
            iconHoverBg: "group-hover:bg-primary",
            color: "text-primary"
        },
    ];

    return (
        <Card className="shadow-md border-0 bg-background/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-xl font-bold tracking-tight">Quick Actions</CardTitle>
                <CardDescription className="text-xs font-medium uppercase tracking-widest text-muted-foreground/60">Frequently accessed administrative tools</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {actions.map((action, idx) => (
                        <Button
                            key={idx}
                            variant="outline"
                            className={`h-auto flex-col gap-4 py-8 rounded-2xl border-2 border-transparent bg-muted/30 ${action.hoverBg} ${action.hoverBorder} transition-all duration-300 group shadow-sm hover:shadow-md`}
                        >
                            <div className={`p-4 rounded-2xl ${action.iconBg} ${action.iconHoverBg} group-hover:text-primary-foreground transition-all duration-300 group-hover:scale-110 shadow-sm`}>
                                <action.icon className={`h-6 w-6 ${action.color} group-hover:text-white transition-colors`} />
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-sm tracking-tight group-hover:text-primary transition-colors">{action.title}</p>
                                <p className="text-[10px] items-center justify-center font-bold uppercase tracking-widest text-muted-foreground/60 mt-1">{action.subtitle}</p>
                            </div>
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};


export default QuickActions;
