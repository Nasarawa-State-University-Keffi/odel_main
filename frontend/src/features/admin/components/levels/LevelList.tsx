import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { levelService } from "../../services/levelService";
import { staffService } from "../../services/staffService";
import { Level } from "../../types/level";
import { Loader2, Layers, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import StaffHeader from "../staffs/StaffHeader"; // Reusing or create similar header
import { motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import CreateLevelModal from "./CreateLevelModal";
import UpdateLevelModal from "./UpdateLevelModal";
import { useAuth } from "@/contexts/AuthContext";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";


const LevelList = () => {
    const [selectedProgrammeType, setSelectedProgrammeType] = useState<string>("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Update State
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);

    // Delete State
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [levelToDelete, setLevelToDelete] = useState<Level | null>(null);

    const { hasAnyRole } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const canCreateLevel = hasAnyRole(["ADMIN", "SUPER_ADMIN"]);
    const canEditLevel = hasAnyRole(["ADMIN", "SUPER_ADMIN"]);
    const canDeleteLevel = hasAnyRole(["ADMIN", "SUPER_ADMIN"]);

    const deleteLevelMutation = useMutation({
        mutationFn: (id: number) => levelService.deleteLevel(id),
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Level deleted successfully.",
            });
            queryClient.invalidateQueries({ queryKey: ["levels"] });
            setIsDeleteAlertOpen(false);
            setLevelToDelete(null);
        },
        onError: (error: any) => {
            const status = error.response?.status;
            let message = "Failed to delete level.";

            if (status === 404) message = "Level not found.";
            else if (status === 422) message = "Cannot delete level - students exist at this level.";
            else if (status === 403) message = "Access denied.";

            toast({
                variant: "destructive",
                title: "Error",
                description: message,
            });
            setIsDeleteAlertOpen(false); // Close alert even on error? Or keep open? Usually close on irrecoverable, keep on validation. keeping close for clean UI.
        }
    });

    // Fetch Programme Types for Filter
    const { data: programmeTypes, isPending: isLoadingProgrammeTypes } = useQuery({
        queryKey: ["programmeTypes"],
        queryFn: staffService.getAllProgrammeTypes,
    });

    // Set default programme type when loaded
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
                // Fallback if no specific ODEL type found but list exists (though we strictly want ODEL)
                // For now, let's strictly try to find relevant ones to avoid showing irrelevant data
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
        // Include common ODEL related terms if specific 'ODEL' tag is missing in some environments
        pt.name.toLowerCase().includes('part time')
    );

    // Fetch Levels based on selected programme type
    const { data: levels, isPending: isLoadingLevels, error: levelsError } = useQuery({
        queryKey: ["levels", selectedProgrammeType],
        queryFn: () => levelService.getAllLevels(Number(selectedProgrammeType)),
        enabled: !!selectedProgrammeType,
    });

    return (
        <div className="flex flex-col space-y-4 p-2 md:p-4 lg:p-6 h-full min-h-0">
            <div className="flex items-center justify-between flex-none">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h1 className="text-3xl font-black tracking-tighter text-[#01402c]">
                        Level Management
                    </h1>
                    <p className="text-muted-foreground mt-1 font-medium">
                        Configure and view academic levels by programme type.
                    </p>
                </motion.div>
                {canCreateLevel && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 shadow-lg shadow-primary/20 h-11 px-6 rounded-xl font-bold transition-all hover:scale-105 active:scale-95">
                            <Plus className="h-5 w-5" />
                            Add New Level
                        </Button>
                    </motion.div>
                )}
            </div>

            <Card className="flex-1 flex flex-col border-0 shadow-2xl bg-background/50 backdrop-blur-sm overflow-hidden min-h-0">
                <CardHeader className="pb-6 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-30 flex-none sticky top-0">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                                <Layers className="h-6 w-6 text-primary" />
                                Academic Levels
                            </CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                List of levels associated with the selected programme
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
                    {levelsError ? (
                        <div className="p-6">
                            <Alert variant="destructive">
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>
                                    {(levelsError as any)?.response?.status === 404
                                        ? "Programme Type not found."
                                        : (levelsError as any)?.message || "Failed to fetch levels."}
                                </AlertDescription>
                            </Alert>
                        </div>
                    ) : isLoadingLevels ? (
                        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                            <p className="text-xs font-bold uppercase tracking-widest">Loading levels...</p>
                        </div>
                    ) : !levels?.length ? (
                        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                            <Layers className="h-12 w-12 mb-4 opacity-20" />
                            <p className="font-medium">No levels found for this programme type.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-muted/50 sticky top-0 z-20">
                                <TableRow>
                                    <TableHead className="w-[100px] font-bold text-[10px] uppercase tracking-widest">ID</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Title</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Order</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Programme Type</TableHead>
                                    <TableHead className="w-[100px] font-bold text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {levels.map((level) => (
                                    <TableRow key={level.id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell className="font-medium text-xs">{level.id}</TableCell>
                                        <TableCell className="font-bold text-xs">{level.title}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{level.levelOrder}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-wide">
                                                {level.programmeType.name}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {canEditLevel && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                                    onClick={() => {
                                                        setSelectedLevel(level);
                                                        setIsUpdateModalOpen(true);
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {canDeleteLevel && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive text-destructive/80"
                                                    onClick={() => {
                                                        setLevelToDelete(level);
                                                        setIsDeleteAlertOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <CreateLevelModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
            />

            <UpdateLevelModal
                open={isUpdateModalOpen}
                onOpenChange={setIsUpdateModalOpen}
                level={selectedLevel}
            />

            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the level
                            <span className="font-bold text-foreground"> {levelToDelete?.title}</span>.
                            {/* Warning about existing students if 422 happens, but generic warning first */}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault(); // Prevent auto-closing to handle loading state if needed, though mutation handles it via success/error
                                if (levelToDelete) deleteLevelMutation.mutate(levelToDelete.id);
                            }}
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={deleteLevelMutation.isPending}
                        >
                            {deleteLevelMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default LevelList;
