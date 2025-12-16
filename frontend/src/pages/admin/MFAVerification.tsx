import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { motion, useAnimation } from "framer-motion";
import { Loader } from "@/components/ui/loader";
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


// defining the mfa type

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
            // console.log('Sending MFA verification (PUT request):', {
            //     endpoint: '/api/auth/admin/verify-mfa',
            //     userId: userId,
            //     codeLength: code.length
            // });

            // verify the mfa code following the type MFAVerifyResponse
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
                    description: "You have been successfully authenticated!",
                });

                setTimeout(() => {
                    navigate("/api/admin/dashboard", { replace: true });
                }, 200);
            } else {
                setError(response.message || "Invalid verification code. Please try again.");
                setCode("");
                toast({
                    variant: "destructive",
                    title: "Verification Failed",
                    description: response.message || "Invalid code.",
                });
                shakeForm();
            }
        } catch (err: unknown) {
            const error = err as any;
            console.error("MFA verification error:", {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                url: error.config?.url,
                method: error.config?.method,
                fullError: error
            });

            let errorMessage = "An error occurred during verification. Please try again.";

            if (error.response?.status === 422) {
                errorMessage = "Invalid verification code. Please check your authenticator app and try again.";
            } else if (error.response?.status === 405) {
                errorMessage = "Method Not Allowed - Please contact support.";
            } else if (error.response?.status === 401 || error.response?.status === 403) {
                errorMessage = "Invalid or expired verification code. Please try again.";
            } else if (error.response?.status === 400) {
                errorMessage = error.response?.data?.message || "Invalid request. Please try again.";
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message && !error.message.includes('status code')) {
                errorMessage = error.message;
            }

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
        <div className="min-h-[100dvh] w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none z-0" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] pointer-events-none z-0" />

            <div className="relative z-10 w-full h-full sm:h-auto sm:max-w-md px-0 sm:px-6 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={controls}
                    transition={{ duration: 0.5 }}
                    className="w-full h-full sm:h-auto"
                >
                    <Card className="w-full h-[100dvh] sm:h-auto rounded-none sm:rounded-xl border-0 sm:border border-border/50 shadow-none sm:shadow-2xl bg-card/95 backdrop-blur-sm flex flex-col justify-center sm:block">
                        <CardHeader>
                            <CardTitle className="text-center text-2xl font-semibold">
                                <div className="mb-6 flex items-center justify-center gap-2">
                                    <div className="inline-flex items-center justify-center mb-4">
                                        <img src={odelLogo} alt="ODEL Logo" className="h-16" />
                                    </div>
                                </div>
                                <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                                    Verify MFA
                                </div>
                            </CardTitle>
                            <p className="text-center text-muted-foreground">
                                Enter the 6-digit code from your authenticator app
                            </p>
                        </CardHeader>

                        <CardContent>
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Loader size="lg" />
                                    <p className="text-muted-foreground mt-4">Verifying code...</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* OTP Input */}
                                    <div className="flex flex-col items-center space-y-4">
                                        <InputOTP
                                            maxLength={6}
                                            value={code}
                                            onChange={(value) => setCode(value)}
                                            disabled={isLoading}
                                            autoFocus
                                        >
                                            <InputOTPGroup className="gap-2">
                                                <InputOTPSlot index={0} className="w-12 h-14 text-lg" />
                                                <InputOTPSlot index={1} className="w-12 h-14 text-lg" />
                                                <InputOTPSlot index={2} className="w-12 h-14 text-lg" />
                                                <InputOTPSlot index={3} className="w-12 h-14 text-lg" />
                                                <InputOTPSlot index={4} className="w-12 h-14 text-lg" />
                                                <InputOTPSlot index={5} className="w-12 h-14 text-lg" />
                                            </InputOTPGroup>
                                        </InputOTP>

                                        {code.length === 6 && !error && (
                                            <p className="text-xs text-primary animate-pulse">
                                                Verifying code automatically...
                                            </p>
                                        )}

                                    </div>

                                    <Button
                                        type="button"
                                        onClick={handleVerifyCode}
                                        className="w-full font-bold py-6 shadow-lg transition-all"
                                        disabled={isLoading || code.length !== 6}
                                    >
                                        {isLoading ? "Verifying..." : "Verify Code"}
                                    </Button>

                                    <div className="text-center space-y-2">
                                        <p className="text-sm text-muted-foreground">
                                            Code will be verified automatically when complete
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>

                        <CardFooter className="flex justify-center text-sm text-muted-foreground">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleBackToLogin}
                                disabled={isLoading}
                                className="gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Login
                            </Button>
                        </CardFooter>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
};

export default MFAVerification;
