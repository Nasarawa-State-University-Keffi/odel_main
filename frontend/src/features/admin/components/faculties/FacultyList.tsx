import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { facultyService } from "@/features/admin/services/facultyService";
import { Faculty, FacultyWithDean } from "@/features/admin/types/faculty";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Search, Building2, User, MoreHorizontal, GraduationCap, Users, Plus, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CreateFacultyModal from "./CreateFacultyModal";
import UpdateFacultyModal from "./UpdateFacultyModal";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const FacultyList = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);

    const { data: facultiesWithDeans, isLoading, isError } = useQuery({
        queryKey: ["faculties-with-deans"],
        queryFn: facultyService.getAllFacultiesWithDeans,
    });

    const filteredFaculties = useMemo(() => {
        if (!facultiesWithDeans) return [];
        // Focus only on ODEL faculty as requested
        const odelFaculties = facultiesWithDeans.filter(item =>
            item.faculty.name.toLowerCase().includes("odel") ||
            item.faculty.name.toLowerCase().includes("distance") ||
            item.faculty.name.toLowerCase().includes("open")
        );

        if (!searchQuery) return odelFaculties;
        return odelFaculties.filter(item =>
            item.faculty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.faculty.code.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [facultiesWithDeans, searchQuery]);

    if (isError) {
        return (
            <div className="p-8 text-center bg-red-50 border border-red-100 rounded-2xl">
                <p className="text-red-600 font-bold">Failed to load faculties. Please try again later.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                        placeholder="Search ODEL faculties..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-11 rounded-xl border-border/40 bg-white/50 backdrop-blur-sm focus:bg-white transition-all shadow-sm"
                    />
                </div>

                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="h-11 px-6 rounded-xl font-black tracking-tight text-white shadow-lg shadow-emerald-900/10 transition-all active:scale-95 group"
                >
                    <Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
                    New Faculty
                </Button>
            </div>

            {/* Faculty Table */}
            <Card className="border-border/40 overflow-hidden shadow-xl shadow-slate-200/50 rounded-2xl bg-white/80 backdrop-blur-md">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-border/40">
                                <TableHead className="w-[300px] font-bold text-slate-600 uppercase tracking-wider text-[11px] py-4 px-6">Faculty Name</TableHead>
                                <TableHead className="font-bold text-slate-600 uppercase tracking-wider text-[11px] py-4">Code</TableHead>
                                <TableHead className="font-bold text-slate-600 uppercase tracking-wider text-[11px] py-4">Type</TableHead>
                                <TableHead className="font-bold text-slate-600 uppercase tracking-wider text-[11px] py-4">Dean/Officer</TableHead>
                                <TableHead className="font-bold text-slate-600 uppercase tracking-wider text-[11px] py-4 text-center">Departments</TableHead>
                                <TableHead className="text-right font-bold text-slate-600 uppercase tracking-wider text-[11px] py-4 px-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="border-b border-border/20">
                                        <TableCell className="py-6 px-6"><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                                        <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                                        <TableCell className="text-right px-6"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredFaculties.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground font-medium italic">
                                        No ODEL faculties found matching your criteria
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredFaculties.map((item) => (
                                    <TableRow key={item.faculty.id} className="group hover:bg-slate-50/80 transition-colors border-b border-border/20">
                                        <TableCell className="py-6 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary transition-transform group-hover:scale-110">
                                                    <Building2 className="h-5 w-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-foreground">{item.faculty.name}</span>
                                                    <span className="text-[11px] font-medium text-muted-foreground">ID: {item.faculty.id}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-black border border-slate-200">
                                                {item.faculty.code}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold border shadow-sm",
                                                item.faculty.science
                                                    ? "bg-blue-50 text-blue-600 border-blue-100"
                                                    : "bg-amber-50 text-amber-600 border-amber-100"
                                            )}>
                                                {item.faculty.science ? "Science" : "Non-Science"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {item.officer ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200 overflow-hidden">
                                                        <User className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-slate-900 leading-tight">
                                                            {item.officer.professionalTitle} {item.officer.user.firstName} {item.officer.user.lastName}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-tighter">
                                                            {item.officer.title.name}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-bold text-muted-foreground/40 italic">Not Assigned</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/5 text-primary border border-primary/10 shadow-sm transition-all hover:scale-105">
                                                <Building2 className="h-3.5 w-3.5" />
                                                <span className="text-xs font-black">{item.faculty.departments?.length || 0}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-52 p-2 rounded-xl shadow-2xl border-border/40">
                                                    <DropdownMenuLabel className="px-3 py-2 text-xs font-black uppercase text-muted-foreground tracking-widest">Options</DropdownMenuLabel>
                                                    <DropdownMenuSeparator className="bg-border/40" />
                                                    <DropdownMenuItem
                                                        className="p-3 rounded-lg focus:bg-primary/10 group cursor-pointer"
                                                        onClick={() => {
                                                            // We need to fetch full faculty info if editing needs departments/questions
                                                            // but current UpdateFacultyRequest only needs id, name, code, science
                                                            setSelectedFaculty(item.faculty as any);
                                                            setIsUpdateModalOpen(true);
                                                        }}
                                                    >
                                                        <Edit className="mr-3 h-4 w-4 text-muted-foreground group-focus:text-primary transition-colors" />
                                                        <span className="text-sm font-bold group-focus:text-primary transition-colors">Edit Faculty</span>
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
            </Card>

            <CreateFacultyModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />

            <UpdateFacultyModal
                isOpen={isUpdateModalOpen}
                onClose={() => {
                    setIsUpdateModalOpen(false);
                    setSelectedFaculty(null);
                }}
                faculty={selectedFaculty}
            />
        </div>
    );
};

export default FacultyList;
