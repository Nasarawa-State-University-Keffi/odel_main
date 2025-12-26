import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, Search, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DepartmentRegistryHeaderProps } from "@/features/admin/types/department";


const DepartmentRegistryHeader = ({
    searchQuery,
    onSearchChange,
    isLoading,
    filterAction
}: DepartmentRegistryHeaderProps) => {
    return (
        <CardHeader className="pb-6 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-30 flex-none sticky top-0">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <CardTitle className="text-3xl font-black tracking-tighter text-[#01402c]">
                        <Building2 className="h-6 w-6 text-primary" />
                        Department Management
                    </CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                        Manage academic departments and faculty
                    </CardDescription>
                </div>

                <div className="flex flex-row gap-2 w-full md:w-auto items-center">
                    <div className="relative flex-1 md:w-80 group">
                        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Search departments..."
                            className="pl-11 pr-10 h-11 bg-background/50 border-border/50 focus:ring-primary/20 rounded-xl transition-all w-full text-xs font-medium"
                            value={searchQuery}
                            onChange={(e) =>
                                onSearchChange(e.target.value)
                            }
                        />
                        {searchQuery && !isLoading && (
                            <button
                                onClick={() => onSearchChange("")}
                                className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                        {isLoading && (
                            <Loader2 className="absolute right-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
                        )}
                    </div>
                    <div className="flex-none">
                        {filterAction}
                    </div>
                </div>
            </div>
        </CardHeader>
    );
};

export default DepartmentRegistryHeader;
