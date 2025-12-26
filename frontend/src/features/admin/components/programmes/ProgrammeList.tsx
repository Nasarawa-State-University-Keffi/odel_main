import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { programmeService } from "../../services/programmeService";
import { staffService } from "../../services/staffService";
import { departmentService } from "../../services/departmentService";
import { Programme } from "../../types/programme";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import CreateProgrammeModal from "./CreateProgrammeModal";
import UpdateProgrammeModal from "./UpdateProgrammeModal";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Loader2, Filter, BookOpen, Search, Plus, MoreHorizontal, Pencil, RotateCcw } from "lucide-react";

const ProgrammeList = () => {
    const [selectedProgrammeType, setSelectedProgrammeType] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [showAvailableOnly, setShowAvailableOnly] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

    // Update Modal State
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedProgrammeId, setSelectedProgrammeId] = useState<number | null>(null);

    const { hasAnyRole } = useAuth();
    const canCreate = hasAnyRole(["ADMIN", "SUPER_ADMIN"]);
    const canEdit = hasAnyRole(["ADMIN", "SUPER_ADMIN"]);

    // Fetch Departments for Filter
    const { data: departments, isPending: isLoadingDepartments } = useQuery({
        queryKey: ["departments"],
        queryFn: departmentService.getAllDepartments,
    });

    // Fetch Programme Types for Filter
    const { data: programmeTypes, isPending: isLoadingProgrammeTypes } = useQuery({
        queryKey: ["programmeTypes"],
        queryFn: staffService.getAllProgrammeTypes,
    });

    // ... (useEffect for default type remains same) ...

    // Fetch Programmes based on filters
    const { data: programmes, isPending: isLoadingProgrammes, error: programmesError } = useQuery({
        queryKey: ["programmes", selectedProgrammeType, showAvailableOnly, selectedDepartment],
        queryFn: () => {
            const typeId = Number(selectedProgrammeType);
            if (showAvailableOnly) {
                return programmeService.getAvailableProgrammes(typeId);
            } else if (selectedDepartment && selectedDepartment !== "all") {
                return programmeService.getProgrammesByDepartmentAndType(typeId, Number(selectedDepartment));
            } else {
                return programmeService.getAllProgrammes(typeId);
            }
        },
        enabled: !!selectedProgrammeType,
    });

    // Set default ODEL programme type when loaded
    useEffect(() => {
        if (programmeTypes && programmeTypes.length > 0) {
            // Filter for ODEL programme types
            const odelTypes = programmeTypes.filter((pt: any) =>
                pt.name.toLowerCase().includes('odel') ||
                pt.modeOfStudy?.toLowerCase().includes('distance') ||
                pt.school?.shortName?.toLowerCase().includes('odel')
            );

            if (odelTypes.length > 0 && !selectedProgrammeType) {
                setSelectedProgrammeType(odelTypes[0].id.toString());
            } else if (!selectedProgrammeType && programmeTypes.length > 0) {
                // Fallback to strictly find relevant ones
                const fallbackMap = programmeTypes.filter((pt: any) => pt.name.toLowerCase().includes('part time') || pt.name.toLowerCase().includes('converson'));
                if (fallbackMap.length > 0) {
                    setSelectedProgrammeType(fallbackMap[0].id.toString());
                }
            }
        }
    }, [programmeTypes, selectedProgrammeType]);

    const filteredProgrammeTypes = programmeTypes?.filter((pt: any) =>
        pt.name.toLowerCase().includes('odel') ||
        pt.modeOfStudy?.toLowerCase().includes('distance') ||
        pt.school?.shortName?.toLowerCase().includes('odel') ||
        pt.name.toLowerCase().includes('part time')
    );


    const queryClient = useQueryClient();

    // Bulk Update Mutation
    const bulkUpdateMutation = useMutation({
        mutationFn: ({ typeId, enable }: { typeId: number, enable: boolean }) =>
            programmeService.toggleAllOnlineStatus(typeId, enable),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["programmes"] });
        },

    });

    // Client-side filtering
    const filteredProgrammes = programmes?.filter(prog =>
        prog.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prog.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col space-y-4 p-2 md:p-4 lg:p-6 h-full min-h-0">
            <div className="flex items-center justify-between flex-none">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h1 className="text-3xl font-black tracking-tighter text-[#01402c]">
                        Programmes
                    </h1>
                    <p className="text-muted-foreground mt-1 font-medium">
                        View and manage academic programmes.
                    </p>
                </motion.div>
                {canCreate && (
                    <div className="flex gap-2">
                        {selectedProgrammeType && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="gap-2 h-11 px-4 rounded-xl font-bold">
                                        Actions
                                        <Filter className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => {
                                        if (confirm("Are you sure you want to make all programmes in this type available online?")) {
                                            bulkUpdateMutation.mutate({ typeId: Number(selectedProgrammeType), enable: true });
                                        }
                                    }}>
                                        Make All Online
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {
                                        if (confirm("Are you sure you want to remove online availability for all programmes in this type?")) {
                                            bulkUpdateMutation.mutate({ typeId: Number(selectedProgrammeType), enable: false });
                                        }
                                    }}>
                                        Make All Offline
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 shadow-lg shadow-primary/20 h-11 px-6 rounded-xl font-bold transition-all hover:scale-105 active:scale-95">
                                <Plus className="h-5 w-5" />
                                Add Programme
                            </Button>
                        </motion.div>
                    </div>
                )}
            </div>

            <Card className="flex-1 flex flex-col border-0 shadow-2xl bg-background/50 backdrop-blur-sm overflow-hidden min-h-0">
                <CardHeader className="pb-6 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-30 flex-none sticky top-0">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                                <BookOpen className="h-6 w-6 text-primary" />
                                Programme List
                            </CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                Browse programmes under the selected category
                            </CardDescription>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by Name or Code..."
                                    className="pl-8 h-9 bg-background/50"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="h-9 border-dashed gap-2">
                                        <Filter className="h-4 w-4" />
                                        Filters
                                        {(selectedDepartment !== "all" || showAvailableOnly) && (
                                            <Badge variant="secondary" className="h-5 px-1 rounded-sm font-normal">
                                                {(selectedDepartment !== "all" ? 1 : 0) + (showAvailableOnly ? 1 : 0)}
                                            </Badge>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-4" align="end">
                                    <div className="grid gap-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <h4 className="font-medium leading-none">Filter Programmes</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    Refine the list of programmes.
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                                                onClick={() => {
                                                    setSelectedDepartment("all");
                                                    setShowAvailableOnly(false);
                                                    setSelectedProgrammeType(""); // Will trigger default selection
                                                }}
                                            >
                                                <RotateCcw className="mr-1 h-3 w-3" />
                                                Reset
                                            </Button>
                                        </div>
                                        <div className="grid gap-2">
                                            <div className="flex items-center justify-between border rounded-md p-2">
                                                <Label htmlFor="online-only" className="text-sm font-medium">Online Only</Label>
                                                <Switch
                                                    id="online-only"
                                                    checked={showAvailableOnly}
                                                    onCheckedChange={setShowAvailableOnly}
                                                    className="scale-75 data-[state=checked]:bg-primary"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-xs font-semibold">Programme Type</Label>
                                                <Select
                                                    value={selectedProgrammeType}
                                                    onValueChange={setSelectedProgrammeType}
                                                >
                                                    <SelectTrigger className="w-full h-8 bg-transparent text-xs">
                                                        <SelectValue placeholder="Select Type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {isLoadingProgrammeTypes ? (
                                                            <div className="p-2 flex justify-center"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
                                                        ) : (
                                                            filteredProgrammeTypes?.map((pt: any) => (
                                                                <SelectItem key={pt.id} value={pt.id.toString()} className="text-xs uppercase">
                                                                    {pt.name}
                                                                </SelectItem>
                                                            ))
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-xs font-semibold">Department</Label>
                                                <Select
                                                    value={selectedDepartment}
                                                    onValueChange={setSelectedDepartment}
                                                >
                                                    <SelectTrigger className="w-full h-8 bg-transparent text-xs">
                                                        <SelectValue placeholder="All Departments" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all" className="text-xs uppercase">All Departments</SelectItem>
                                                        {isLoadingDepartments ? (
                                                            <div className="p-2 flex justify-center"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
                                                        ) : (
                                                            departments?.map((dept: any) => (
                                                                <SelectItem key={dept.id} value={dept.id.toString()} className="text-xs uppercase">
                                                                    {dept.name}
                                                                </SelectItem>
                                                            ))
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0 overflow-auto flex-1 min-h-0">
                    {programmesError ? (
                        <div className="p-6">
                            <Alert variant="destructive">
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>
                                    {(programmesError as any)?.response?.status === 404
                                        ? "Programme Type not found."
                                        : (programmesError as any)?.message || "Failed to fetch programmes."}
                                </AlertDescription>
                            </Alert>
                        </div>
                    ) : isLoadingProgrammes ? (
                        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                            <p className="text-xs font-bold uppercase tracking-widest">Loading programmes...</p>
                        </div>
                    ) : !filteredProgrammes?.length ? (
                        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                            <BookOpen className="h-12 w-12 mb-4 opacity-20" />
                            <p className="font-medium">No programmes found.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-muted/50 sticky top-0 z-20">
                                <TableRow>
                                    <TableHead className="w-[80px] font-bold text-[10px] uppercase tracking-widest">ID</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Code</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Programme Name</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Type</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProgrammes.map((prog) => (
                                    <TableRow key={prog.id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell className="font-medium text-xs text-muted-foreground">{prog.id}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-mono font-bold text-xs">
                                                {prog.code}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-bold text-sm text-[#01402c]">{prog.name}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {prog.programmeType?.name}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        onClick={() => navigator.clipboard.writeText(prog.id.toString())}
                                                    >
                                                        Copy ID
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {canEdit && (
                                                        <DropdownMenuItem onClick={() => {
                                                            setSelectedProgrammeId(prog.id);
                                                            setIsUpdateModalOpen(true);
                                                        }}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Edit Programme
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <CreateProgrammeModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                programmeTypeId={selectedProgrammeType}
            />

            <UpdateProgrammeModal
                open={isUpdateModalOpen}
                onOpenChange={setIsUpdateModalOpen}
                programmeId={selectedProgrammeId}
            />
        </div>
    );
};

export default ProgrammeList;
