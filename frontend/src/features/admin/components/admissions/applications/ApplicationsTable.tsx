import { Search, Filter, ArrowRight, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";

interface ApplicationsTableProps {
    applications: any[];
    isApplicationsLoading: boolean;
    onViewDetails: (app: any) => void;
}

const ApplicationsTable = ({ applications, isApplicationsLoading, onViewDetails }: ApplicationsTableProps) => {

    const groupedApps = applications.reduce((acc, app) => {
        const mode = app.admissionMode || "Unspecified Mode";
        if (!acc[mode]) acc[mode] = [];
        acc[mode].push(app);
        return acc;
    }, {} as Record<string, any[]>);

    const sortedModes = Object.keys(groupedApps).sort();

    return (
        <Card className="shadow-2xl border-0 bg-background/40 backdrop-blur-md overflow-hidden rounded-[2rem] border-white/20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            <CardHeader className="relative border-b border-white/10 bg-white/5 p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">Active Admissions</CardTitle>
                        <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                            Detailed breakdown of current admission tracks
                        </CardDescription>
                    </div>
                    <div className="relative w-full md:w-80 group">
                        <div className="absolute inset-0 bg-primary/20 blur-[20px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                        <Input
                            placeholder="Search by name..."
                            className="pl-11 h-12 bg-background/60 border-white/20 focus:ring-primary/20 text-sm font-medium rounded-xl transition-all shadow-inner relative z-10"
                        />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0 relative min-h-[400px]">
                {isApplicationsLoading ? (
                    <div className="p-8 space-y-6">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-20 w-full rounded-2xl opacity-60" />
                        ))}
                    </div>
                ) : applications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
                        <div className="h-20 w-20 bg-muted/30 rounded-full flex items-center justify-center animate-pulse">
                            <Filter className="h-10 w-10 text-muted-foreground/40" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-lg font-bold text-foreground">No records found</p>
                            <p className="text-sm text-muted-foreground font-medium">Try adjusting your filters to see more results.</p>
                        </div>
                    </div>
                ) : (
                    <Accordion type="multiple" defaultValue={sortedModes} className="w-full">
                        {sortedModes.map((mode) => (
                            <AccordionItem key={mode} value={mode} className="border-b border-white/5 last:border-0 px-8">
                                <AccordionTrigger className="hover:no-underline py-6 group">
                                    <div className="flex items-center gap-4">
                                        <Badge variant="outline" className="h-9 px-4 text-xs font-bold uppercase tracking-wider bg-primary/5 text-primary border-primary/20 rounded-lg group-hover:bg-primary/10 transition-colors shadow-sm">
                                            {mode.replace(/_/g, " ")}
                                        </Badge>
                                        <span className="text-xs font-bold text-muted-foreground/80 group-hover:text-foreground transition-colors">
                                            {groupedApps[mode].length} Tracks
                                        </span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-8 pt-2">
                                    <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/5 shadow-inner">
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-white/5 border-b-white/10 hover:bg-white/5">
                                                        <TableHead className="w-[80px] font-bold text-[10px] uppercase tracking-widest px-6 h-12 text-muted-foreground">ID</TableHead>
                                                        <TableHead className="font-bold text-[10px] uppercase tracking-widest px-6 h-12 text-muted-foreground">Admission Name</TableHead>
                                                        <TableHead className="font-bold text-[10px] uppercase tracking-widest px-6 h-12 text-muted-foreground">Semester</TableHead>
                                                        <TableHead className="font-bold text-[10px] uppercase tracking-widest px-6 h-12 text-muted-foreground">Timeline</TableHead>
                                                        <TableHead className="text-center font-bold text-[10px] uppercase tracking-widest px-6 h-12 text-muted-foreground">Status</TableHead>
                                                        <TableHead className="text-right px-6 h-12"></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {groupedApps[mode].map((app, idx) => (
                                                        <TableRow
                                                            key={app.id}
                                                            className="group hover:bg-white/10 transition-colors border-b-white/5 last:border-0"
                                                        >
                                                            <TableCell className="font-mono text-[10px] font-bold text-muted-foreground px-6 py-5">
                                                                #{app.id}
                                                            </TableCell>
                                                            <TableCell className="px-6 py-5">
                                                                <div className="font-bold text-sm text-foreground/90 group-hover:text-primary transition-colors truncate max-w-[250px]" title={app.name}>
                                                                    {app.name}
                                                                </div>
                                                                <div className="text-[10px] font-medium text-muted-foreground/60 mt-0.5 uppercase tracking-wide">
                                                                    {app.session?.name}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="px-6 py-5">
                                                                <span className="text-xs font-bold text-muted-foreground">{app.semester?.title || "N/A"}</span>
                                                            </TableCell>
                                                            <TableCell className="px-6 py-5">
                                                                <div className="flex flex-col gap-1 text-[10px] font-medium">
                                                                    <div className="flex items-center gap-1.5 text-muted-foreground/80">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></span>
                                                                        Starts: {new Date(app.startDate).toLocaleDateString()}
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 text-muted-foreground/80">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500/50"></span>
                                                                        Ends: {new Date(app.endDate).toLocaleDateString()}
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-center px-6 py-5">
                                                                {app.isActive ? (
                                                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg">
                                                                        Active
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="bg-muted text-muted-foreground border-border/50 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg">
                                                                        Inactive
                                                                    </Badge>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right px-6 py-5">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => onViewDetails(app)}
                                                                    className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                                                                >
                                                                    <ArrowRight className="h-4 w-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </CardContent>
        </Card>
    );
};

export default ApplicationsTable;
