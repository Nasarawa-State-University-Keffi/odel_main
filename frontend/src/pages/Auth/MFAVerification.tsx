import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { authAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import Cookies from "js-cookie";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import odelLogo from '@/assets/odel-logo.jpg';

type MFAVerifyResponse = {
    success?: boolean;
    message?: string;
    jwt?: string;
    refreshToken?: string;
    userId?: string;
    roles?: string[];
    mfa?: boolean;
}

const MFAVerification = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [code, setCode] = useState("");
    const [userId, setUserId] = useState<string>("");
    const controls = useAnimation();

    useEffect(() => {
        controls.start({ opacity: 1, y: 0 });
    }, [controls]);

    const shakeForm = () => {
        controls.start({
            x: [0, -10, 10, -10, 10, 0],
            transition: { duration: 0.5 }
        });
    };

    useEffect(() => {
        const pendingUser = location.state?.userId || Cookies.get('pending_mfa_user');
        if (!pendingUser) {
            navigate('/api/auth/admin/login');
            return;
        }
        setUserId(pendingUser);
    }, [location, navigate]);

    useEffect(() => {
        if (code.length === 6 && !isLoading && userId) {
            handleVerifyCode();
        }
    }, [code, isLoading, userId]);

    const handleVerifyCode = async () => {
        if (code.length !== 6) {
            setError("Please enter a valid 6-digit code");
            shakeForm();
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response: MFAVerifyResponse = await authAPI.verifyMFA({
                userId: userId,
                code: code,
            });

            if (response.success || response.jwt) {
                Cookies.remove('pending_mfa_user');
                const newJwt = response.jwt || '';
                const newRefreshToken = response.refreshToken || '';
                const storedUserStr = Cookies.get('admin_user');
                let userData = null;
                try {
                    userData = storedUserStr ? JSON.parse(storedUserStr) : null;
                } catch (e) {
                    console.error("Failed to parse stored user data", e);
                }

                if (response.jwt) {
                    userData = {
                        userId: response.userId || userId,
                        roles: response.roles || userData?.roles || ['ADMIN'],
                        mfa: true
                    };
                }

                login(userData, newJwt, newRefreshToken);
                toast({
                    title: "Verification Successful",
                    description: "Identity confirmed. Access granted.",
                });

                setTimeout(() => {
                    navigate("/api/admin/dashboard", { replace: true });
                }, 200);
            } else {
                setError(response.message || "Invalid verification code.");
                setCode("");
                toast({
                    variant: "destructive",
                    title: "Verification Failed",
                    description: response.message || "Invalid code.",
                });
                shakeForm();
            }
        } catch (err: any) {
            let errorMessage = "An error occurred during verification.";
            if (err.response?.status === 422) errorMessage = "Invalid verification code.";
            else if (err.response?.data?.message) errorMessage = err.response.data.message;

            setError(errorMessage);
            setCode("");
            toast({
                variant: "destructive",
                title: "Verification Failed",
                description: errorMessage,
            });
            shakeForm();
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToLogin = () => {
        Cookies.remove('pending_mfa_user');
        navigate('/api/auth/admin/login');
    };

    return (
        <div className="min-h-[100dvh] w-full flex items-center justify-center relative overflow-hidden bg-background">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none z-0" />
            <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse" />

            <div className="relative z-10 w-full max-w-md px-6 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={controls}
                    transition={{ duration: 0.5 }}
                    className="w-full"
                >
                    <Card className="w-full rounded-3xl border-border/50 shadow-2xl bg-card/60 backdrop-blur-xl flex flex-col overflow-hidden">
                        <CardHeader className="pt-10 pb-6">
                            <div className="flex flex-col items-center">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="relative mb-6"
                                >
                                    <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full" />
                                    <img src={odelLogo} alt="ODEL Logo" className="relative h-20 w-auto rounded-2xl border-2 border-background shadow-lg" />
                                </motion.div>
                                <CardTitle className="text-center">
                                    <span className="block text-3xl font-black tracking-tighter text-foreground uppercase">
                                        Confirm Identity
                                    </span>
                                    <span className="block text-[10px] font-bold uppercase tracking-[0.3em] text-primary mt-2">
                                        Multi-Factor Authentication
                                    </span>
                                </CardTitle>
                                <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-4">
                                    Enter 6-digit security code
                                </p>
                            </div>
                        </CardHeader>

                        <CardContent className="px-8 pb-8">
                            <AnimatePresence mode="wait">
                                {isLoading ? (
                                    <motion.div
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex flex-col items-center justify-center py-12"
                                    >
                                        <div className="relative">
                                            <div className="absolute -inset-4 bg-primary/20 blur-xl rounded-full animate-pulse" />
                                            <Loader2 className="h-12 w-12 text-primary animate-spin relative" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mt-8 animate-pulse">
                                            Synchronizing...
                                        </p>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="content"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="space-y-8"
                                    >
                                        <div className="flex flex-col items-center">
                                            <InputOTP
                                                maxLength={6}
                                                value={code}
                                                onChange={(value) => setCode(value)}
                                                disabled={isLoading}
                                                autoFocus
                                            >
                                                <InputOTPGroup className="gap-3">
                                                    {[0, 1, 2, 3, 4, 5].map((i) => (
                                                        <InputOTPSlot
                                                            key={i}
                                                            index={i}
                                                            className="w-12 h-16 text-xl font-black rounded-xl border-border/50 bg-background/40 focus:ring-primary/20"
                                                        />
                                                    ))}
                                                </InputOTPGroup>
                                            </InputOTP>
                                        </div>

                                        <Button
                                            type="button"
                                            onClick={handleVerifyCode}
                                            className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary"
                                            disabled={isLoading || code.length !== 6}
                                        >
                                            Complete Access
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </CardContent>

                        <CardFooter className="flex justify-center pb-8 border-t border-border/10 pt-6">
                            <Button
                                variant="ghost"
                                onClick={handleBackToLogin}
                                disabled={isLoading}
                                className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors gap-2 hover:bg-transparent px-0"
                            >
                                <ArrowLeft className="h-3 w-3" />
                                Cancel verification
                            </Button>
                        </CardFooter>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
};

export default MFAVerification;
