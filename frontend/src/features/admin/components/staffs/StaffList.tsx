import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, MoreHorizontal, UserCog } from "lucide-react";
import CreateStaffModal from "./CreateStaffModal";
import { Staff } from "../../types/staff";
import { staffService } from "../../services/staffService";

const StaffList = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [staffs, setStaffs] = useState<Staff[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchStaffs = async () => {
        setIsLoading(true);
        try {
            const data = await staffService.getAllStaff();
            setStaffs(data);
        } catch (error) {
            console.error("Failed to fetch staff", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStaffs();
    }, []);

    const refreshList = () => {
        fetchStaffs();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage ODEL staff members, roles, and permissions.
                    </p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add New Staff
                </Button>
            </div>

            <Card className="border-0 shadow-md">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between gap-4">
                        <CardTitle className="text-lg font-medium flex items-center gap-2">
                            <UserCog className="h-5 w-5 text-primary" />
                            All Staff Members
                        </CardTitle>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by name, email or role..."
                                className="pl-9 bg-muted/50 border-0"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>Name</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {staffs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No staff members found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    staffs.map((staff) => (
                                        <TableRow key={staff.id} className="hover:bg-muted/50">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{staff.name || `${staff.firstName} ${staff.lastName}`}</span>
                                                    <span className="text-xs text-muted-foreground">{staff.userId}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm">{staff.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1 flex-wrap">
                                                    {staff.roles.map((role, idx) => (
                                                        <Badge key={idx} variant="secondary" className="text-xs">
                                                            {role.replace('_', ' ')}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={staff.enabled ? "default" : "destructive"}
                                                    className={staff.enabled ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}
                                                >
                                                    {staff.enabled ? "Active" : "Disabled"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <CreateStaffModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                onSuccess={refreshList}
            />
        </div>
    );
};

export default StaffList;
