import { ApplicationType } from "../../../types/admission";
import { Cog } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface ApplicationAutomationProps {
    automation: ApplicationType["automation"];
}

const ApplicationAutomation = ({ automation }: ApplicationAutomationProps) => {
    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="automation" className="border-0 bg-muted/10 rounded-xl px-4 ring-1 ring-border/30">
                <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-indigo-100">
                            <Cog className="h-4 w-4 text-indigo-600" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-foreground/70 text-left">Automation Rules</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 px-2 pt-2">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">AutoUTME</p>
                            <div className="flex items-center gap-2">
                                <div className={cn("h-2 w-2 rounded-full", automation?.autoLoadUtme ? "bg-emerald-500" : "bg-slate-300")} />
                                <span className="text-[10px] font-bold">{automation?.autoLoadUtme ? "Auto Load Enabled" : "Manual Loading"}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">AutoClearance</p>
                            <div className="flex items-center gap-2">
                                <div className={cn("h-2 w-2 rounded-full", automation?.autoClearApplicants ? "bg-emerald-500" : "bg-slate-300")} />
                                <span className="text-[10px] font-bold">{automation?.autoClearApplicants ? "Automated" : "Officer Decision"}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">Post-UTME</p>
                            <div className="flex items-center gap-2">
                                <div className={cn("h-2 w-2 rounded-full", automation?.processPostUtme ? "bg-emerald-500" : "bg-slate-300")} />
                                <span className="text-[10px] font-bold">{automation?.processPostUtme ? "System Process" : "Disabled"}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">SSCE Verify</p>
                            <div className="flex items-center gap-2">
                                <div className={cn("h-2 w-2 rounded-full", automation?.ssceVerification ? "bg-emerald-500" : "bg-slate-300")} />
                                <span className="text-[10px] font-bold">{automation?.ssceVerification ? "Active Integration" : "Manual Check"}</span>
                            </div>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
};

export default ApplicationAutomation;
