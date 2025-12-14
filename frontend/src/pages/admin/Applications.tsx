import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye, Filter } from "lucide-react";

const Applications = () => {
    const applications = [
        { id: 1, applicantName: "Sarah Johnson", programme: "Computer Science", status: "Pending", date: "2025-12-01" },
        { id: 2, applicantName: "Michael Chen", programme: "Business Admin", status: "Approved", date: "2025-12-02" },
        { id: 3, applicantName: "Emma Davis", programme: "Engineering", status: "Under Review", date: "2025-12-03" },
        { id: 4, applicantName: "James Wilson", programme: "Public Admin", status: "Pending", date: "2025-12-04" },
        { id: 5, applicantName: "Olivia Brown", programme: "Education", status: "Rejected", date: "2025-12-05" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Applications</h1>
                <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filter
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search applications..."
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 font-medium">Applicant</th>
                                    <th className="text-left py-3 px-4 font-medium">Programme</th>
                                    <th className="text-left py-3 px-4 font-medium">Status</th>
                                    <th className="text-left py-3 px-4 font-medium">Date</th>
                                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.map((app) => (
                                    <tr key={app.id} className="border-b hover:bg-muted/50 transition-colors">
                                        <td className="py-3 px-4 font-medium">{app.applicantName}</td>
                                        <td className="py-3 px-4 text-muted-foreground">{app.programme}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${app.status === "Approved"
                                                    ? "bg-green-100 text-green-700"
                                                    : app.status === "Pending"
                                                        ? "bg-yellow-100 text-yellow-700"
                                                        : app.status === "Under Review"
                                                            ? "bg-blue-100 text-blue-700"
                                                            : "bg-red-100 text-red-700"
                                                }`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-muted-foreground">{app.date}</td>
                                        <td className="py-3 px-4 text-right">
                                            <Button variant="ghost" size="sm" className="gap-2">
                                                <Eye className="h-4 w-4" />
                                                View
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Applications;
