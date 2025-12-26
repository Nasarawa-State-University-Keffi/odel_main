import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { departmentService } from "@/features/admin/services/departmentService";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Upload, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SetSignatureModalProps } from "@/features/admin/types/department";


const SetSignatureModal = ({ open, onOpenChange }: SetSignatureModalProps) => {
    const [signatureFile, setSignatureFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const { toast } = useToast();

    const uploadMutation = useMutation({
        mutationFn: (signature: string) => departmentService.setSignature(signature),
        onSuccess: () => {
            toast({ title: "Success", description: "Signature set successfully." });
            handleClose();
        },
        onError: (error: any) => {
            const status = error?.response?.status;
            if (status === 422) {
                toast({
                    variant: "destructive",
                    title: "Validation Error",
                    description: "Signature file is required and must be valid."
                });
            } else if (status === 404) {
                toast({
                    variant: "destructive",
                    title: "User Not Found",
                    description: "Could not identify the current user."
                });
            } else if (status === 403) {
                toast({
                    variant: "destructive",
                    title: "Access Denied",
                    description: "Only HODs can set the department signature."
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to upload signature. Please try again."
                });
            }
        }
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSignatureFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpload = () => {
        if (!preview) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please select a signature image first."
            });
            return;
        }
        uploadMutation.mutate(preview);
    };

    const handleClose = () => {
        setSignatureFile(null);
        setPreview(null);
        onOpenChange(false);
        uploadMutation.reset();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Set Department Signature</DialogTitle>
                    <DialogDescription>
                        Upload your signature to be used for official department documents.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex flex-col gap-3">
                        <Label htmlFor="signature" className="text-right sr-only">Signature</Label>
                        <div className="flex items-center justify-center w-full">
                            <Label
                                htmlFor="signature-upload"
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 border-slate-300 transition-all"
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-2 text-slate-400" />
                                    <p className="text-sm text-slate-500 font-semibold">Click to upload signature</p>
                                    <p className="text-xs text-slate-400">PNG, JPG (MAX. 2MB)</p>
                                </div>
                                <Input
                                    id="signature-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </Label>
                        </div>
                    </div>

                    {preview && (
                        <div className="relative border rounded-md p-2 bg-slate-50/50 flex justify-center items-center h-24">
                            <img src={preview} alt="Signature Preview" className="max-h-full max-w-full object-contain" />
                        </div>
                    )}

                    {uploadMutation.isError && (uploadMutation.error as any)?.response?.status === 403 && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Permission Denied</AlertTitle>
                            <AlertDescription>
                                You must be an HOD to perform this action.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={uploadMutation.isPending}>Cancel</Button>
                    <Button onClick={handleUpload} disabled={!preview || uploadMutation.isPending} className="bg-[#8cc63f] hover:bg-[#7ab62f]">
                        {uploadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Set Signature
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SetSignatureModal;
