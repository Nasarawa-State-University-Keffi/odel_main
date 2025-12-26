import { ApplicationType } from "../../../types/admission";
import { Settings2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ApplicationTechnicalDetailsProps {
    type: ApplicationType;
}

const ApplicationTechnicalDetails = ({ type }: ApplicationTechnicalDetailsProps) => {
    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="technical" className="border-0 bg-muted/10 rounded-xl px-4 ring-1 ring-border/30">
                <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-slate-200">
                            <Settings2 className="h-4 w-4 text-slate-600" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-foreground/70 text-left">Technical Details</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="grid grid-cols-2 gap-4 pb-4 px-2 pt-2">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">System ID</p>
                            <p className="text-xs font-mono font-bold text-foreground">#{type.id}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">Created At</p>
                            <p className="text-xs font-mono font-bold text-foreground">
                                {(() => {
                                    try {
                                        return type.createdAt ? new Date(type.createdAt).toLocaleDateString() : "N/A";
                                    } catch (e) {
                                        return "Invalid Date";
                                    }
                                })()}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">Last Updated</p>
                            <p className="text-xs font-mono font-bold text-foreground">
                                {(() => {
                                    try {
                                        return type.updatedAt ? new Date(type.updatedAt).toLocaleDateString() : "N/A";
                                    } catch (e) {
                                        return "Invalid Date";
                                    }
                                })()}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">Code</p>
                            <p className="text-xs font-mono font-bold text-foreground">{type.code}</p>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
};

export default ApplicationTechnicalDetails;
