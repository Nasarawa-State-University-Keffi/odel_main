import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/features/admin/components/admission/components/ui/button";
import { FloatingInput } from "@/features/admin/components/admission/components/ui/floating-input";
import { Eye, EyeOff, Mail, Lock, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { authAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import Cookies from "js-cookie";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/features/admin/components/admission/components/ui/card";
import odelLogo from '@/assets/odel-logo.jpg'
import { useAuth } from "@/contexts/AuthContext";

const adminLoginSchema = z.object({
    username: z.string().min(1, "Username or email is required"),
    password: z.string().min(1, "Password is required"),
});
type AdminLoginForm = z.infer<typeof adminLoginSchema>;

const AdminLogin = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { toast } = useToast();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const controls = useAnimation();

    useEffect(() => {
        controls.start({ opacity: 1, y: 0 });
    }, [controls]);

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<AdminLoginForm>({
        resolver: zodResolver(adminLoginSchema),
        mode: "onChange",
    });

    const onSubmit = async (data: AdminLoginForm) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await authAPI.login({
                username: data.username,
                password: data.password,
                applicant: true,
            });

            if (response.old && !response.jwt) {
                toast({
                    title: "Account Update Required",
                    description: "Please reset your password to activate your account.",
                });
                navigate("/api/auth/forgot-password", { state: { email: data.username } });
                setIsLoading(false);
                return;
            }

            if (response.userId && response.roles) {
                const hasAllowedRole = response.roles.some(role =>
                    ['ADMIN', 'SUPER_ADMIN', 'ADMISSION_OFFICER', 'STUDENT', 'APPLICANT'].includes(role)
                );

                if (!hasAllowedRole) {
                    setError("Access denied. Authorized privileges required.");
                    toast({
                        variant: "destructive",
                        title: "Access Denied",
                        description: "You don't have permission to access this portal.",
                    });
                    controls.start({
                        x: [0, -10, 10, -10, 10, 0],
                        transition: { duration: 0.5 }
                    });
                    setIsLoading(false);
                    return;
                }

                if (response.mfa) {
                    Cookies.set('pending_mfa_user', response.userId, { secure: true, sameSite: 'strict' });
                    if (response.jwt) {
                        Cookies.set('admin_token', response.jwt, { secure: true, sameSite: 'strict' });
                    }
                    Cookies.set('admin_refresh_token', response.refreshToken, { secure: true, sameSite: 'strict' });
                    Cookies.set('admin_user', JSON.stringify({
                        userId: response.userId,
                        roles: response.roles,
                        mfa: response.mfa,
                    }), { secure: true, sameSite: 'strict' });

                    toast({
                        title: "MFA Required",
                        description: "Please enter your verification code",
                    });

                    navigate("/api/auth/admin/verify-mfa", {
                        state: { userId: response.userId }
                    });
                    return;
                }

                const userData = {
                    userId: response.userId,
                    roles: response.roles,
                    mfa: response.mfa,
                    username: data.username
                };

                login(userData, response.jwt, response.refreshToken);

                toast({
                    title: "Login Successful",
                    description: "Welcome back!",
                });

                // Redirect based on role
                if (response.roles.includes('STUDENT') || response.roles.includes('APPLICANT')) {
                    navigate("/dashboard");
                } else {
                    navigate("/api/admin/dashboard");
                }
            } else {
                throw new Error("Invalid response from server");
            }
        } catch (err: any) {
            console.error('Login error:', err);
            const errorMessage = err.response?.data?.message || "Invalid credentials. Please try again.";
            setError(errorMessage);
            toast({
                variant: "destructive",
                title: "Login Failed",
                description: errorMessage,
            });
            controls.start({
                x: [0, -10, 10, -10, 10, 0],
                transition: { duration: 0.5 }
            });
            setValue('password', '');
            setValue('username', '');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] w-full flex items-center justify-center relative overflow-hidden bg-background">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none z-0" />
            <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse" />
            <div className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] bg-accent/5 rounded-full blur-[120px] pointer-events-none z-0" />

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
                                        Welcome Back
                                    </span>
                                    <span className="block text-[10px] font-bold uppercase tracking-[0.3em] text-primary mt-2">
                                        ODEL Portal Gateway
                                    </span>
                                </CardTitle>
                            </div>
                        </CardHeader>

                        <CardContent className="px-8 pb-8">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <div className="space-y-2">
                                    <div className="group transition-all">
                                        <FloatingInput
                                            id="username"
                                            label="User ID or Email"
                                            disabled={isLoading}
                                            icon={<Mail className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />}
                                            {...register("username")}
                                            className="bg-background/40 border-border/50 h-14 rounded-2xl group-focus-within:border-primary/50 group-focus-within:ring-primary/20"
                                        />
                                    </div>
                                    {errors.username && (
                                        <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-[10px] font-bold uppercase tracking-wider text-destructive mt-1.5 ml-1">
                                            {errors.username.message}
                                        </motion.p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <div className="relative group transition-all">
                                        <FloatingInput
                                            id="password"
                                            label="Password"
                                            disabled={isLoading}
                                            type={showPassword ? "text" : "password"}
                                            icon={<Lock className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />}
                                            {...register("password")}
                                            className="bg-background/40 border-border/50 h-14 rounded-2xl pr-12 group-focus-within:border-primary/50 group-focus-within:ring-primary/20"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors z-20 h-10 w-10 flex items-center justify-center rounded-xl"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-[10px] font-bold uppercase tracking-wider text-destructive mt-1.5 ml-1">
                                            {errors.password.message}
                                        </motion.p>
                                    )}
                                </div>
                                <div className="flex justify-end mt-1">
                                    <Link
                                        to="/api/auth/forgot-password"
                                        className="text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary hover:bg-primary/90"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Authenticating
                                        </div>
                                    ) : (
                                        "Unlock Dashboard"
                                    )}
                                </Button>
                            </form>
                        </CardContent>

                        <CardFooter className="flex justify-center pb-8 border-t border-border/10 pt-6">
                            <Button
                                variant="ghost"
                                onClick={() => navigate("/api/auth/register")}
                                className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors gap-2 hover:bg-transparent px-0"
                            >
                                <ArrowLeft className="h-3 w-3" />
                                Return to applicant portal
                            </Button>
                        </CardFooter>
                    </Card>

                    <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 mt-8">
                        NSUK Open Distance eLearning
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminLogin;
