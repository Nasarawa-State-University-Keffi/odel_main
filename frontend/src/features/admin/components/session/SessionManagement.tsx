import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionService } from "../../services/sessionService";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Plus, Calendar, Settings, Power, PowerOff, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/features/admin/components/admission/components/ui/card";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import { Badge } from "@/features/admin/components/admission/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/features/admin/components/admission/components/ui/alert";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/features/admin/components/admission/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import CreateSessionModal from "./CreateSessionModal";
import EditSessionModal from "./EditSessionModal";
import { Session } from "../../types/session";
import { useToast } from "@/hooks/use-toast";

const SessionManagement = () => {
    const { hasRole } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);

    const { data: allSessions, isLoading, error, refetch } = useQuery({
        queryKey: ["sessions"],
        queryFn: sessionService.getAllSessions,
    });

    // Filter to strictly show ODEL related sessions
    const sessions = allSessions?.filter(session =>
        session.programmeType.name.toLowerCase().includes('odel') ||
        session.programmeType.name.toLowerCase().includes('distance')
    );

    const activateMutation = useMutation({
        mutationFn: sessionService.activateSession,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sessions"] });
            toast({ title: "Success", description: "Session activated successfully." });
        },
        onError: () => toast({ variant: "destructive", title: "Error", description: "Failed to activate session." }),
    });

    const deactivateMutation = useMutation({
        mutationFn: sessionService.deactivateSession,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sessions"] });
            toast({ title: "Success", description: "Session deactivated successfully." });
        },
        onError: () => toast({ variant: "destructive", title: "Error", description: "Failed to deactivate session." }),
    });

    const closeSemesterMutation = useMutation({
        mutationFn: sessionService.closeSemester,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sessions"] });
            toast({ title: "Success", description: "Semester closed successfully." });
        },
        onError: () => toast({ variant: "destructive", title: "Error", description: "Failed to close semester." }),
    });

    const isAdmin = hasRole("ADMIN") || hasRole("SUPER_ADMIN");

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <div className="flex flex-col space-y-8 p-8 w-full bg-slate-50/50 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-3xl font-black tracking-tight text-[#01402c]">
                        SESSION <span className="text-primary">MANAGEMENT</span>
                    </h1>
                    <p className="text-muted-foreground font-medium text-lg">Manage academic sessions and semesters.</p>
                </div>
                {isAdmin && (
                    <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 font-bold shadow-lg shadow-primary/20">
                        <Plus className="h-4 w-4" />
                        Create Session
                    </Button>
                )}
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    <p className="mt-4 font-bold text-slate-600 animate-pulse text-xs uppercase tracking-widest">Loading Sessions...</p>
                </div>
            ) : error ? (
                <Alert variant="destructive" className="rounded-3xl border-2 shadow-lg">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle className="text-lg font-black tracking-tight">Error</AlertTitle>
                    <AlertDescription className="font-medium mt-1">Failed to load sessions.</AlertDescription>
                    <Button variant="outline" className="mt-4 bg-white/20 border-white/40 font-bold" onClick={() => refetch()}>Retry</Button>
                </Alert>
            ) : (
                <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sessions?.map((session) => (
                        <motion.div key={session.id} variants={item}>
                            <Card className={`border-0 shadow-lg rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 group ${session.isOpen ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                                <div className={`h-2 ${session.isOpen ? 'bg-gradient-to-r from-primary to-emerald-400' : 'bg-slate-200'}`} />
                                <CardHeader className="bg-white pb-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="outline" className={`font-bold ${session.isOpen ? 'border-primary/20 text-primary bg-primary/5' : 'text-slate-500'}`}>
                                            {session.programmeType.name}
                                        </Badge>
                                        {session.isOpen && (
                                            <Badge className="bg-emerald-500 hover:bg-emerald-600">Active</Badge>
                                        )}
                                    </div>
                                    <CardTitle className="text-2xl font-black text-slate-800 leading-tight flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-muted-foreground" />
                                        {session.name}
                                    </CardTitle>
                                    <CardDescription className="font-medium">
                                        {new Date(session.registrationBegins).toLocaleDateString()} - {new Date(session.registrationEnds).toLocaleDateString()}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="bg-white pt-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground text-xs uppercase font-bold">Payment</span>
                                            <span className={`font-semibold ${session.openForPayment ? 'text-emerald-600' : 'text-slate-500'}`}>
                                                {session.openForPayment ? "Open" : "Closed"}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground text-xs uppercase font-bold">Late Payment</span>
                                            <span className={`font-semibold ${session.latePaymentEnabled ? 'text-amber-600' : 'text-slate-500'}`}>
                                                {session.latePaymentEnabled ? "Enabled" : "Disabled"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="border-t pt-4">
                                        <p className="text-xs uppercase font-bold text-muted-foreground mb-2">Semesters</p>
                                        <div className="flex flex-wrap gap-2">
                                            {session.semesters.map(sem => (
                                                <Badge key={sem.id} variant="secondary" className={`${sem.isOpen ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}>
                                                    {sem.title}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-white border-t border-slate-100 p-4">
                                    <div className="w-full flex justify-end gap-2">
                                        {isAdmin && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" size="sm" className="font-bold">
                                                        <Settings className="h-4 w-4 mr-2" />
                                                        Manage
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => { setSelectedSession(session); setIsEditModalOpen(true); }}>
                                                        Edit Configuration
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {!session.isOpen ? (
                                                        <DropdownMenuItem onClick={() => activateMutation.mutate(session.id)} className="text-emerald-600 focus:text-emerald-700">
                                                            <Power className="h-4 w-4 mr-2" />
                                                            Activate Session
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem onClick={() => deactivateMutation.mutate(session.id)} className="text-red-600 focus:text-red-700">
                                                            <PowerOff className="h-4 w-4 mr-2" />
                                                            Deactivate
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem onClick={() => closeSemesterMutation.mutate(session.id)} className="text-amber-600 focus:text-amber-700">
                                                        <XCircle className="h-4 w-4 mr-2" />
                                                        Close Current Semester
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                    {!sessions?.length && (
                        <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                            <p className="text-muted-foreground font-medium">No sessions created yet.</p>
                        </div>
                    )}
                </motion.div>
            )}

            <CreateSessionModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
            <EditSessionModal open={isEditModalOpen} onOpenChange={setIsEditModalOpen} session={selectedSession} />
        </div>
    );
};

export default SessionManagement;
