import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, BarChart3, FileText } from "lucide-react";

const UpcomingTasksList = () => {
    const upcomingTasks = [
        { id: 1, task: "Review 25 pending applications", priority: "high", dueDate: "Today", icon: Clock },
        { id: 2, task: "Approve semester registrations", priority: "medium", dueDate: "Tomorrow", icon: Calendar },
        { id: 3, task: "Generate monthly report", priority: "low", dueDate: "Dec 15", icon: BarChart3 },
        { id: 4, task: "Update course catalogue", priority: "medium", dueDate: "Dec 20", icon: FileText },
    ];

    const getPriorityConfig = (priority: string) => {
        const configs = {
            high: { bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/20" },
            medium: { bg: "bg-secondary/10", text: "text-secondary", border: "border-secondary/20" },
            low: { bg: "bg-muted/50", text: "text-muted-foreground", border: "border-border/50" },
        };
        return configs[priority as keyof typeof configs] || configs.low;
    };

    return (
        <Card className="shadow-md border-0 bg-background/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold tracking-tight">Upcoming Tasks</CardTitle>
                        <CardDescription className="text-xs font-medium uppercase tracking-widest text-muted-foreground/60">Priority items for your attention</CardDescription>
                    </div>
                    <Badge variant="outline" className="rounded-lg bg-primary/5 text-primary border-primary/20 font-bold px-3 py-1">
                        4 Pending
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {upcomingTasks.map((task) => {
                        const config = getPriorityConfig(task.priority);
                        const TaskIcon = task.icon;
                        return (
                            <div
                                key={task.id}
                                className="p-5 rounded-2xl bg-muted/30 border border-transparent hover:border-primary/20 hover:bg-muted/50 transition-all duration-300 group cursor-pointer shadow-sm hover:shadow-md"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-2.5 rounded-xl bg-background shadow-sm group-hover:scale-110 transition-transform`}>
                                        <TaskIcon className="h-4 w-4 text-primary" />
                                    </div>
                                    <Badge className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-lg border ${config.bg} ${config.text} ${config.border}`}>
                                        {task.priority}
                                    </Badge>
                                </div>
                                <p className="text-sm font-bold leading-tight group-hover:text-primary transition-colors mb-3">
                                    {task.task}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    <Calendar className="h-3 w-3 opacity-50" />
                                    <span>Due: {task.dueDate}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <Button variant="outline" className="w-full mt-2 gap-2 h-12 rounded-xl border-dashed border-2 hover:border-solid hover:bg-primary/5 transition-all text-sm font-bold uppercase tracking-wider">
                    <Clock className="h-4 w-4" />
                    Manage All System Tasks
                </Button>
            </CardContent>
        </Card>
    );
};


export default UpcomingTasksList;
