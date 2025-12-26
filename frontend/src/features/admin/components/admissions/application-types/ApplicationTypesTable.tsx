import { useState } from "react";
import { Search, Info, Settings2, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ApplicationType } from "@/features/admin/types/admission";
import ApplicationCategoryCard from "./ApplicationCategoryCard";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface ApplicationTypesTableProps {
    types: ApplicationType[];
    isLoading: boolean;
    onEdit: (type: ApplicationType) => void;
}

const ApplicationTypesTable = ({ types, isLoading, onEdit }: ApplicationTypesTableProps) => {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredTypes = types.filter((type) => {
        const query = searchQuery.toLowerCase();
        return (
            (type.name || "").toLowerCase().includes(query) ||
            (type.code || "").toLowerCase().includes(query) ||
            (type.programmeType?.name || "").toLowerCase().includes(query) ||
            (type.programmeType?.code || "").toLowerCase().includes(query)
        );
    });

    // Grouping by Programme Type
    const groupedTypes = filteredTypes.reduce((acc, type) => {
        const groupName = type.programmeType?.name || "Uncategorized";
        if (!acc[groupName]) acc[groupName] = [];
        acc[groupName].push(type);
        return acc;
    }, {} as Record<string, ApplicationType[]>);

    const sortedGroups = Object.keys(groupedTypes).sort();

    return (
        <div className="space-y-8">
            {/* Header / Search Area */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-background/40 backdrop-blur-md p-6 rounded-3xl border border-border/50 shadow-lg shrink-0">
                <div className="space-y-1.5 text-left">
                    <h2 className="text-xl font-black tracking-tight flex items-center gap-2.5 text-foreground/90">
                        <Settings2 className="h-6 w-6 text-primary" />
                        Application Configurations
                    </h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                        Manage various application types and their specific behaviors
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-all" />
                        <Input
                            placeholder="Search categories (e.g. ODEL, Nursing)..."
                            className="pl-12 h-12 bg-background/50 border-border/50 focus:ring-primary/20 rounded-2xl transition-all font-medium text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-border/50 bg-background/50 hover:bg-primary/5 hover:text-primary shrink-0">
                        <SlidersHorizontal className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* List / Groups */}
            <div className="space-y-4">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="space-y-4">
                            <Skeleton className="h-[100px] w-full rounded-3xl opacity-50" />
                        </div>
                    ))
                ) : filteredTypes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-32 bg-background/20 rounded-3xl border-2 border-dashed border-border/50 opacity-60">
                        <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center">
                            <Info className="h-10 w-10 text-muted-foreground/40" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="font-black text-lg text-foreground/80">
                                {searchQuery ? "No matching categories found" : "Global categories not initialized"}
                            </p>
                            <p className="text-sm text-muted-foreground font-bold">
                                {searchQuery ? "Try adjusting your search criteria" : "Please contact a system administrator to sync application types."}
                            </p>
                        </div>
                    </div>
                ) : (
                    <Accordion type="multiple" defaultValue={sortedGroups} className="w-full space-y-4">
                        {sortedGroups.map((group) => (
                            <AccordionItem key={group} value={group} className="border border-border/40 bg-background/40 px-6 rounded-2xl data-[state=open]:bg-background/60 transition-all">
                                <AccordionTrigger className="hover:no-underline py-6">
                                    <div className="flex items-center gap-4">
                                        <Badge variant="outline" className="h-8 px-3 text-sm font-black uppercase tracking-wider bg-primary/5 text-primary border-primary/20 rounded-lg">
                                            {group}
                                        </Badge>
                                        <span className="text-xs font-bold text-muted-foreground">
                                            {groupedTypes[group].length} Categories
                                        </span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-6 pt-2">
                                    <div className="grid grid-cols-1 gap-8">
                                        {groupedTypes[group].map((type) => (
                                            <ApplicationCategoryCard key={type.id} type={type} onEdit={onEdit} />
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </div>

        </div>
    );
};

export default ApplicationTypesTable;

