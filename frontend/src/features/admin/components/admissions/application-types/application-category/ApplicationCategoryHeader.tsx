import { ApplicationType } from "../../../types/admission";
import { Badge } from "@/components/ui/badge";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Globe, UserCheck, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ApplicationCategoryHeaderProps {
    type: ApplicationType;
    onEdit: (type: ApplicationType) => void;
}

const ApplicationCategoryHeader = ({ type, onEdit }: ApplicationCategoryHeaderProps) => {
    return (
        <CardHeader className="p-0 border-b border-border/50">
            <div className="bg-gradient-to-br from-primary/10 via-background to-background p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-tighter px-2 rounded-md">
                                {type.programmeType?.code || type.code}
                            </Badge>
                            <Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-tighter bg-amber-100 text-amber-700 border-amber-200">
                                {type.status || "N/A"}
                            </Badge>
                        </div>
                        <CardTitle className="text-2xl font-black tracking-tight text-foreground/90 leading-none">
                            {type.name}
                        </CardTitle>

                    </div>

                    <div className="flex flex-col items-end gap-1.5 md:text-right">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEdit(type)}
                            className="h-8 gap-2 rounded-lg border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground font-bold shadow-sm transition-all"
                        >
                            <Settings2 className="h-3.5 w-3.5" />
                            Edit Config
                        </Button>
                    </div>
                </div>
            </div>

            {/* SUMMARY STATS SUB-HEADER */}
            <div className="grid grid-cols-2 border-t border-border/50">
                <div className="p-3 text-center border-r border-border/50 bg-muted/5">
                    <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">Type</p>
                    <p className="text-xs font-black text-foreground/80">{type.programmeType?.name || "N/A"}</p>
                </div>
                <div className="p-3 text-center border-r border-border/50 bg-muted/5">
                    <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">Workflow</p>
                    <p className="text-xs font-black text-foreground/80">Category {type.admissionType || "N/A"}</p>
                </div>

            </div>
        </CardHeader>
    );
};

export default ApplicationCategoryHeader;
