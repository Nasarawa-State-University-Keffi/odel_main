import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { modeOfEntryService } from "../../services/modeOfEntryService";
import { programmeTypeService } from "../../services/programmeTypeService";
import { staffService } from "../../services/staffService";
import { ModeOfEntry } from "../../types/modeOfEntry";
import { ProgrammeType } from "../../types/programmeType";
import { Loader2, Filter, FileText, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/features/admin/components/admission/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/admin/components/admission/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/admin/components/admission/components/ui/table";
import { motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/features/admin/components/admission/components/ui/alert";
import { Badge } from "@/features/admin/components/admission/components/ui/badge";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import { Plus, Pencil, Trash2, MoreHorizontal, Eye } from "lucide-react";
import CreateModeOfEntryModal from "./CreateModeOfEntryModal";
import UpdateModeOfEntryModal from "./UpdateModeOfEntryModal";
import ViewModeOfEntryModal from "./ViewModeOfEntryModal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/features/admin/components/admission/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/features/admin/components/admission/components/ui/alert-dialog";

const ModeOfEntryList = () => {
    const [selectedProgrammeType, setSelectedProgrammeType] = useState<string>("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Update State
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedMode, setSelectedMode] = useState<ModeOfEntry | null>(null);

    // View State
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewModeId, setViewModeId] = useState<number | null>(null);

    const { hasAnyRole } = useAuth();
    const canCreate = hasAnyRole(["ADMIN", "SUPER_ADMIN"]);
    const canEdit = hasAnyRole(["ADMIN", "SUPER_ADMIN"]);

    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Delete State
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [modeToDelete, setModeToDelete] = useState<ModeOfEntry | null>(null);

    const deleteMutation = useMutation({
        mutationFn: (id: number) => modeOfEntryService.deleteModeOfEntry(id),
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Mode of entry deleted successfully.",
            });
            queryClient.invalidateQueries({ queryKey: ["modeOfEntries"] });
            setIsDeleteAlertOpen(false);
        },
        onError: (error: any) => {
            const status = error.response?.status;
            let message = "Failed to delete mode of entry.";

            if (status === 404) message = "Mode of entry not found.";
            else if (status === 422) message = "Cannot delete: Students exist with this entry mode.";
            else if (status === 403) message = "Access denied.";

            toast({
                variant: "destructive",
                title: "Error",
                description: message,
            });
        }
    });

    const handleDeleteClick = (mode: ModeOfEntry) => {
        setModeToDelete(mode);
        setIsDeleteAlertOpen(true);
    };

    const confirmDelete = () => {
        if (modeToDelete) {
            deleteMutation.mutate(modeToDelete.id);
        }
    };

    // Fetch Programme Types for Filter
    const { data: programmeTypes, isPending: isLoadingProgrammeTypes } = useQuery<ProgrammeType[]>({
        queryKey: ["programmeTypes"],
        queryFn: programmeTypeService.getAllProgrammeTypes,
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

    // Fetch Mode of Entries based on selected programme type
    const { data: modeOfEntries, isPending: isLoadingModes, error: modesError } = useQuery({
        queryKey: ["modeOfEntries", selectedProgrammeType],
        queryFn: () => modeOfEntryService.getAllModeOfEntries(Number(selectedProgrammeType)),
        enabled: !!selectedProgrammeType,
    });

    return (
        <div className="flex flex-col space-y-4 p-2 md:p-4 lg:p-6 h-full min-h-0">
            <div className="flex items-center justify-between flex-none">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h1 className="text-3xl md:text-3xl font-black tracking-tight text-[#01402c]">
                        MODE OF ENTRY <span className="text-primary">MANAGEMENT</span>
                    </h1>
                    <p className="text-muted-foreground mt-1 font-medium">
                        Manage entry modes and requirements for programmes.
                    </p>
                </motion.div>
                {canCreate && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 shadow-lg shadow-primary/20 h-11 px-6 rounded-xl font-bold transition-all hover:scale-105 active:scale-95">
                            <Plus className="h-5 w-5" />
                            Add Mode of Entry
                        </Button>
                    </motion.div>
                )}
            </div>

            <Card className="flex-1 flex flex-col border-0 shadow-2xl bg-background/50 backdrop-blur-sm overflow-hidden min-h-0">
                <CardHeader className="pb-6 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-30 flex-none sticky top-0">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                                <FileText className="h-6 w-6 text-primary" />
                                Entry Modes
                            </CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                List of available entry modes for the selected programme
                            </CardDescription>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 bg-background/50 border border-border/50 rounded-lg px-3 py-1">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <Select
                                    value={selectedProgrammeType}
                                    onValueChange={setSelectedProgrammeType}
                                >
                                    <SelectTrigger className="w-[200px] h-9 bg-transparent border-0 focus:ring-0 text-xs font-bold uppercase tracking-wide">
                                        <SelectValue placeholder="Select Programme Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {isLoadingProgrammeTypes ? (
                                            <div className="p-2 flex justify-center"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
                                        ) : (
                                            filteredProgrammeTypes?.map((pt: any) => (
                                                <SelectItem key={pt.id} value={pt.id.toString()} className="text-xs font-bold uppercase tracking-wide">
                                                    {pt.name}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0 overflow-auto flex-1 min-h-0">
                    {modesError ? (
                        <div className="p-6">
                            <Alert variant="destructive">
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>
                                    {(modesError as any)?.response?.status === 404
                                        ? "Programme Type not found."
                                        : (modesError as any)?.message || "Failed to fetch mode of entries."}
                                </AlertDescription>
                            </Alert>
                        </div>
                    ) : isLoadingModes ? (
                        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                            <p className="text-xs font-bold uppercase tracking-widest">Loading entry modes...</p>
                        </div>
                    ) : !modeOfEntries?.length ? (
                        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                            <FileText className="h-12 w-12 mb-4 opacity-20" />
                            <p className="font-medium">No entry modes found for this programme type.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-muted/50 sticky top-0 z-20">
                                <TableRow>
                                    <TableHead className="w-[80px] font-bold text-[10px] uppercase tracking-widest">ID</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Title</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Value</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Level</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Semesters</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">UTME Req</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Matriculation</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Docs Req</TableHead>
                                    <TableHead className="w-[80px] font-bold text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {modeOfEntries.map((mode) => (
                                    <TableRow key={mode.id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell className="font-medium text-xs">{mode.id}</TableCell>
                                        <TableCell className="font-bold text-xs">{mode.title}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground font-mono">{mode.value}</TableCell>
                                        <TableCell className="text-xs">{mode.level?.title || '-'}</TableCell>
                                        <TableCell className="text-xs">{mode.numberOfSemesters}</TableCell>
                                        <TableCell className="text-center">
                                            {mode.requireUtmeScores ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {mode.useOnMatriculation ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {mode.requireScreeningDocuments ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                                            )}
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
                                                        onClick={() => navigator.clipboard.writeText(mode.id.toString())}
                                                    >
                                                        Copy ID
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => {
                                                        setViewModeId(mode.id);
                                                        setIsViewModalOpen(true);
                                                    }}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {canEdit && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => {
                                                                setSelectedMode(mode);
                                                                setIsUpdateModalOpen(true);
                                                            }}>
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Edit Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDeleteClick(mode)}
                                                                className="text-destructive focus:text-destructive"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete Mode
                                                            </DropdownMenuItem>
                                                        </>
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

            <CreateModeOfEntryModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                programmeTypeId={selectedProgrammeType}
            />

            <UpdateModeOfEntryModal
                open={isUpdateModalOpen}
                onOpenChange={setIsUpdateModalOpen}
                modeOfEntry={selectedMode}
                programmeTypeId={selectedProgrammeType}
            />

            <ViewModeOfEntryModal
                open={isViewModalOpen}
                onOpenChange={setIsViewModalOpen}
                modeId={viewModeId}
            />

            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the mode of entry
                            <span className="font-bold text-foreground"> {modeToDelete?.title}</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default ModeOfEntryList;
