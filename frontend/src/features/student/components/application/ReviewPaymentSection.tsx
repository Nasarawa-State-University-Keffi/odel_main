import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/features/admin/components/admission/components/ui/card";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import { CreditCard, CheckCircle, Loader2 } from "lucide-react";
import { Separator } from "@/features/admin/components/admission/components/ui/separator";

interface ReviewPaymentSectionProps {
    isLoading?: boolean;
}

export const ReviewPaymentSection = ({ isLoading }: ReviewPaymentSectionProps) => {
    return (
        <Card className="border-primary/50 bg-primary/5 backdrop-blur-xl shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-primary">
                    <CreditCard className="h-5 w-5" />
                    Review & Payment
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Application Fee</span>
                        <span className="font-bold">₦10,000.00</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Verification Fee</span>
                        <span className="font-bold">₦1,000.00</span>
                    </div>
                </div>

                <Separator className="bg-primary/20" />

                <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Total Payable</span>
                    <span className="font-black text-xl text-primary">₦11,000.00</span>
                </div>

                <div className="bg-background/50 p-4 rounded-lg flex items-start gap-3 border border-border/50">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                        By clicking the button below, you confirm that all provided information is accurate. False information may lead to disqualification.
                    </p>
                </div>
            </CardContent>
            <CardFooter>
                <Button
                    type="submit"
                    className="w-full h-12 text-base font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        "Proceed to Pay & Submit"
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
};
