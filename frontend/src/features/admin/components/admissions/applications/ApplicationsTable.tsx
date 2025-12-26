import { Search, Eye, Filter, GraduationCap, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
        <Card className="shadow-2xl border-0 bg-background/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/5 p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-black tracking-tight">Active Admissions</CardTitle>
                        <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                            Detailed breakdown of current admission tracks
                        </CardDescription>
                    </div>
                    <div className="relative w-full md:w-72 group">
                        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Search by name..."
                            className="pl-11 h-11 bg-background/50 border-border/50 focus:ring-primary/20 rounded-xl transition-all"
                        />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {isApplicationsLoading ? (
                    <div className="p-6 space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full rounded-xl opacity-60" />
                        ))}
                    </div>
                ) : applications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                        <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center">
                            <Filter className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-bold text-foreground">No records found</p>
                            <p className="text-xs text-muted-foreground font-medium">Try adjusting your filters to see more results.</p>
                        </div>
                    </div>
                ) : (
                    <Accordion type="multiple" defaultValue={sortedModes} className="w-full">
                        {sortedModes.map((mode) => (
                            <AccordionItem key={mode} value={mode} className="border-b border-border/40 last:border-0 px-6 data-[state=open]:bg-muted/5">
                                <AccordionTrigger className="hover:no-underline py-5 group">
                                    <div className="flex items-center gap-4">
                                        <Badge variant="outline" className="h-8 px-3 text-sm font-black uppercase tracking-wider bg-primary/5 text-primary border-primary/20 rounded-lg group-hover:bg-primary/10 transition-colors">
                                            {mode.replace(/_/g, " ")}
                                        </Badge>
                                        <span className="text-xs font-bold text-muted-foreground">
                                            {groupedApps[mode].length} Tracks
                                        </span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-6 pt-0">
                                    <div className="rounded-xl border border-border/40 overflow-hidden bg-background/60">
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-muted/30 hover:bg-muted/30 border-b-border/50">
                                                        <TableHead className="w-[80px] font-bold text-[10px] uppercase tracking-widest px-4">ID</TableHead>
                                                        <TableHead className="font-bold text-[10px] uppercase tracking-widest px-4">Admission Name</TableHead>
                                                        {/* Removed Entry Mode column as it is now the header */}
                                                        <TableHead className="font-bold text-[10px] uppercase tracking-widest px-4">Semester</TableHead>
                                                        <TableHead className="font-bold text-[10px] uppercase tracking-widest px-4">Timeline</TableHead>
                                                        <TableHead className="text-center font-bold text-[10px] uppercase tracking-widest px-4">Status</TableHead>
                                                        <TableHead className="text-right px-4">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {groupedApps[mode].map((app) => (
                                                        <TableRow key={app.id} className="group hover:bg-primary/5 transition-colors border-b-border/30 last:border-0">
                                                            <TableCell className="font-mono text-[10px] font-bold text-muted-foreground px-4 py-4">
                                                                #{app.id}
                                                            </TableCell>
                                                            <TableCell className="px-4 py-4">
                                                                <div className="font-black text-sm text-foreground/90 group-hover:text-primary transition-colors truncate max-w-[250px]" title={app.name}>
                                                                    {app.name || "Untitled Admission"}
                                                                </div>
                                                            </TableCell>
                                                            {/* Entry Mode Cell Removed */}
                                                            <TableCell className="px-4 py-4 font-bold text-xs text-muted-foreground/80">
                                                                {app.semester?.title || "N/A"}
                                                            </TableCell>
                                                            <TableCell className="px-4 py-4">
                                                                <div className="flex items-center gap-2 text-xs font-bold">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-muted-foreground opacity-60 text-[9px] uppercase tracking-tighter">Starts</span>
                                                                        <span className="whitespace-nowrap">{new Date(app.startDate).toLocaleDateString()}</span>
                                                                    </div>
                                                                    <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
                                                                    <div className="flex flex-col">
                                                                        <span className="text-muted-foreground opacity-60 text-[9px] uppercase tracking-tighter">Ends</span>
                                                                        <span className="whitespace-nowrap">{new Date(app.endDate).toLocaleDateString()}</span>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-center px-4 py-4">
                                                                <Badge
                                                                    className={`
                                                                        ${app.open
                                                                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                                                            : "bg-rose-100 text-rose-700 hover:bg-rose-200"}
                                                                        border-0 font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full shadow-sm
                                                                    `}
                                                                >
                                                                    {app.open ? "Active" : "Closed"}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right px-4 py-4">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all opacity-0 group-hover:opacity-100 shadow-sm border"
                                                                    onClick={() => onViewDetails(app)}
                                                                >
                                                                    <Eye className="h-4 w-4" />
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
