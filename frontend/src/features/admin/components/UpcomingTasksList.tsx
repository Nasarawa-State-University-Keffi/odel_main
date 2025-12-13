import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";

const UpcomingTasksList = () => {
    const upcomingTasks = [
        { id: 1, task: "Review 25 pending applications", priority: "high", dueDate: "Today" },
        { id: 2, task: "Approve semester registrations", priority: "medium", dueDate: "Tomorrow" },
        { id: 3, task: "Generate monthly report", priority: "low", dueDate: "Dec 15" },
        { id: 4, task: "Update course catalogue", priority: "medium", dueDate: "Dec 20" },
    ];

    const getPriorityColor = (priority: string) => {
        const colors = {
            high: "bg-destructive/10 text-destructive border-destructive/20",
            medium: "bg-secondary/10 text-secondary border-secondary/20",
            low: "bg-muted text-muted-foreground border-border",
        };
        return colors[priority as keyof typeof colors] || colors.low;
    };

    return (
        <Card className="shadow-md border-0">
            <CardHeader>
                <CardTitle>Upcoming Tasks</CardTitle>
                <CardDescription>Items requiring attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {upcomingTasks.map((task) => (
                    <div
                        key={task.id}
                        className="p-4 rounded-xl border-2 border-dashed hover:border-solid hover:shadow-md transition-all duration-200 group cursor-pointer"
                    >
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="text-sm font-medium flex-1 group-hover:text-primary transition-colors">
                                {task.task}
                            </p>
                            <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Due: {task.dueDate}</span>
                        </div>
                    </div>
                ))}

                <Button variant="outline" className="w-full mt-4 gap-2">
                    <Clock className="h-4 w-4" />
                    View All Tasks
                </Button>
            </CardContent>
        </Card>
    );
};

export default UpcomingTasksList;
