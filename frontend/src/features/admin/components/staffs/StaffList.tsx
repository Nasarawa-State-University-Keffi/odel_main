import { useState, useEffect } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
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
import { Search, Plus, MoreHorizontal, UserCog, Loader2, Edit } from "lucide-react";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CreateStaffModal from "./CreateStaffModal";
import UpdateStaffModal from "./UpdateStaffModal";
import { Staff } from "../../types/staff";
import { staffService } from "../../services/staffService";

const ITEMS_PER_PAGE = 10;

const StaffList = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Senate filter removed

    const fetchStaffs = async (page: number, size: number) => {
        const data = await staffService.getAllStaffPaginated(page - 1, size);
        return data;
    };

    const fetchStaffById = async (staffId: string) => {
        try {
            const staff = await staffService.getStaffById(staffId);
            // Wrap single staff in paginated response format
            return {
                content: [staff],
                totalPages: 1,
                totalElements: 1,
                last: true,
                size: 1,
                number: 0,
                first: true,
                empty: false,
            };
        } catch (error: any) {
            if (error.response?.status === 404) {
                toast({
                    title: "Not Found",
                    description: "Staff not found",
                    variant: "destructive",
                });
                return {
                    content: [],
                    totalPages: 0,
                    totalElements: 0,
                    last: true,
                    size: 1,
                    number: 0,
                    first: true,
                    empty: true,
                };
            }
            throw error;
        }
    };

    const fetchStaffByEmail = async (email: string) => {
        try {
            const staff = await staffService.getStaffByEmail(email);
            // Wrap single staff in paginated response format
            return {
                content: [staff],
                totalPages: 1,
                totalElements: 1,
                last: true,
                size: 1,
                number: 0,
                first: true,
                empty: false,
            };
        } catch (error: any) {
            if (error.response?.status === 404) {
                toast({
                    title: "Not Found",
                    description: "Staff with this email not found",
                    variant: "destructive",
                });
                return {
                    content: [],
                    totalPages: 0,
                    totalElements: 0,
                    last: true,
                    size: 1,
                    number: 0,
                    first: true,
                    empty: true,
                };
            }
            throw error;
        }
    };

    // Helper function to detect if search query is an email
    const isEmail = (query: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query);
    };

    const {
        data,
        isPending: isLoading,
        isError,
        error,
        isPlaceholderData,
    } = useQuery({
        queryKey: debouncedSearch ? ["staffs", "search", debouncedSearch] : ["staffs", currentPage, ITEMS_PER_PAGE],
        queryFn: () => {
            if (debouncedSearch) {
                // Check if the search query is an email
                return isEmail(debouncedSearch)
                    ? fetchStaffByEmail(debouncedSearch)
                    : fetchStaffById(debouncedSearch);
            }
            return fetchStaffs(currentPage, ITEMS_PER_PAGE);
        },
        placeholderData: debouncedSearch ? undefined : keepPreviousData,
        staleTime: 60000, // 1 minute
    });

    const staffs = data?.content.map((item: any) => {
        // Handle both nested user object (from list API) and flat structure (from get-by-email API)
        const user = item.user || item || {};

        // Extract role names from role objects if they exist
        const roles = Array.isArray(user.roles)
            ? user.roles.map((role: any) => typeof role === 'string' ? role : role?.name || 'Unknown')
            : [];

        return {
            id: item.id || user.id,
            name: user.name,
            firstName: user.firstName,
            lastName: user.lastName,
            userId: user.userId,
            email: user.email,
            roles: roles,
            enabled: user.enabled ?? false,
            senate: item.senate || user.senate, // Get senate from staff or user object
        } as Staff & { senate?: string };
    }) || [];

    // Senate filter logic removed - using all staffs
    const filteredStaffs = staffs;

    const totalPages = data?.totalPages || 0;

    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    const handleStaffCreated = () => {
        queryClient.invalidateQueries({ queryKey: ["staffs"] });
    };

    const renderPaginationItems = () => {
        const items = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                items.push(
                    <PaginationItem key={i}>
                        <PaginationLink
                            isActive={currentPage === i}
                            onClick={() => handlePageChange(i)}
                            className="cursor-pointer"
                        >
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                );
            }
            return items;
        }

        items.push(
            <PaginationItem key={1}>
                <PaginationLink
                    isActive={currentPage === 1}
                    onClick={() => handlePageChange(1)}
                    className="cursor-pointer"
                >
                    1
                </PaginationLink>
            </PaginationItem>
        );

        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);

        if (start > 2) {
            items.push(
                <PaginationItem key="ellipsis-start">
                    <PaginationEllipsis />
                </PaginationItem>
            );
        }

        for (let i = start; i <= end; i++) {
            items.push(
                <PaginationItem key={i}>
                    <PaginationLink
                        isActive={currentPage === i}
                        onClick={() => handlePageChange(i)}
                        className="cursor-pointer"
                    >
                        {i}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        if (end < totalPages - 1) {
            items.push(
                <PaginationItem key="ellipsis-end">
                    <PaginationEllipsis />
                </PaginationItem>
            );
        }

        items.push(
            <PaginationItem key={totalPages}>
                <PaginationLink
                    isActive={currentPage === totalPages}
                    onClick={() => handlePageChange(totalPages)}
                    className="cursor-pointer"
                >
                    {totalPages}
                </PaginationLink>
            </PaginationItem>
        );

        return items;
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between flex-none">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Staff Management
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage ODEL staff members, roles, and permissions.
                    </p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add New Staff
                </Button>
            </div>

            <Card className="flex-1 flex flex-col min-h-0 border-0 shadow-md">
                <CardHeader className="pb-4 flex-none">
                    <div className="flex items-center justify-between gap-4">
                        <CardTitle className="text-lg font-medium flex items-center gap-2">
                            <UserCog className="h-5 w-5 text-primary" />
                            All Staff Members
                        </CardTitle>
                        <div className="flex items-center gap-3">
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search by staff ID or email..."
                                    className="pl-9 pr-9 bg-muted/50 border-0"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {(isLoading || searchQuery !== debouncedSearch) && (
                                    <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                            </div>

                        </div>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {/* Horizontal scroll wrapper for mobile */}
                    <div className="overflow-x-auto flex-1 min-h-0">
                        <div className="rounded-md border flex flex-col min-h-full min-w-[800px]">
                            {/* Fixed Header */}
                            <div className="border-b bg-muted/50">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="h-12 w-[25%]">Name</TableHead>
                                            <TableHead className="h-12 w-[25%]">Contact</TableHead>
                                            <TableHead className="h-12 w-[20%]">Role</TableHead>
                                            <TableHead className="h-12 w-[15%]">Status</TableHead>
                                            <TableHead className="text-right h-12 w-[15%]">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                </Table>
                            </div>

                            {/* Scrollable Body */}
                            <div className="flex-1 overflow-auto">
                                <Table>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-24 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                                                        <span className="text-sm text-muted-foreground">Hold on, loading staff.....</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : isError ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-24 text-center text-red-500">
                                                    {(() => {
                                                        const err = error as any;

                                                        // INCASE THE REQUEST FAILED BECAUSE OF NETWORK ERRORS
                                                        if (err?.message === "Network Error" || err?.code === "ERR_NETWORK") {
                                                            return "Failed to load staff members. Please try again.";
                                                        }
                                                        // Check for server provided message
                                                        const serverMessage = err?.response?.data?.message || err?.response?.data?.error;
                                                        if (serverMessage) return serverMessage;

                                                        // Check if data is just a string (sometimes servers return plain text)
                                                        if (typeof err?.response?.data === "string") return err.response.data;

                                                        // Handle specific status codes if no message provided
                                                        const status = err?.response?.status;
                                                        if (status === 422) return "Validation Error (422)";
                                                        if (status === 403) return "Access Denied (403)";
                                                        if (status === 404) return "Resource Not Found (404)";
                                                        if (status === 500) return "Internal Server Error (500)";

                                                        // Fallback avoids "Request failed with status code X" if possible, but shows it if mostly nothing else
                                                        return err?.message || "An unexpected error occurred";
                                                    })()}
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredStaffs.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-24 text-center">
                                                    No staff members found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredStaffs.map((staff) => (
                                                <TableRow
                                                    key={staff.id}
                                                    className={`hover:bg-muted/50 ${isPlaceholderData ? 'opacity-50' : ''}`}
                                                >
                                                    <TableCell className="w-[25%] max-w-0">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium truncate">
                                                                {staff.name
                                                                    ? staff.name
                                                                    : staff.firstName && staff.lastName
                                                                        ? `${staff.firstName} ${staff.lastName}`
                                                                        : "Unknown Name"}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground truncate">
                                                                {staff.userId || "No Staff ID"}
                                                            </span>
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="w-[25%] max-w-0">
                                                        <span className="text-sm truncate block" title={staff.email || "N/A"}>
                                                            {staff.email || "N/A"}
                                                        </span>
                                                    </TableCell>

                                                    <TableCell className="w-[20%] max-w-0">
                                                        {staff.roles && staff.roles.length > 0 ? (
                                                            <div className="flex items-center gap-1 flex-wrap">
                                                                <Badge variant="secondary" className="text-xs whitespace-nowrap max-w-[120px] truncate block overflow-hidden text-ellipsis">
                                                                    {staff.roles[0].replace("_", " ")}
                                                                </Badge>
                                                                {staff.roles.length > 1 && (
                                                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                                        and {staff.roles.length - 1}+
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">N/A</span>
                                                        )}
                                                    </TableCell>

                                                    <TableCell className="w-[15%]">
                                                        <Badge
                                                            variant={
                                                                staff.enabled
                                                                    ? "default"
                                                                    : "destructive"
                                                            }
                                                            className={
                                                                staff.enabled
                                                                    ? "bg-green-100 text-green-700 hover:bg-green-100"
                                                                    : ""
                                                            }
                                                        >
                                                            {staff.enabled ? "Active" : "Disabled"}
                                                        </Badge>
                                                    </TableCell>

                                                    <TableCell className="text-right w-[15%]">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        setSelectedStaff(staff);
                                                                        setIsUpdateModalOpen(true);
                                                                    }}
                                                                >
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Update Staff
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-4 flex-none">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() =>
                                                handlePageChange(currentPage - 1)
                                            }
                                            className={
                                                currentPage === 1
                                                    ? "pointer-events-none opacity-50"
                                                    : "cursor-pointer"
                                            }
                                        />
                                    </PaginationItem>

                                    {renderPaginationItems()}

                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() =>
                                                handlePageChange(currentPage + 1)
                                            }
                                            className={
                                                currentPage === totalPages
                                                    ? "pointer-events-none opacity-50"
                                                    : "cursor-pointer"
                                            }
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </CardContent>
            </Card>

            <CreateStaffModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                onSuccess={handleStaffCreated}
            />

            <UpdateStaffModal
                open={isUpdateModalOpen}
                onOpenChange={setIsUpdateModalOpen}
                staff={selectedStaff}
                onSuccess={handleStaffCreated}
            />
        </div>
    );
};

export default StaffList;
