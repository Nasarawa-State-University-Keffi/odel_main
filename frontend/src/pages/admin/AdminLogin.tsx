import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { Eye, EyeOff, Mail, Lock, ShieldCheck } from "lucide-react";
import { motion, useAnimation } from "framer-motion";
import { Loader } from "@/components/ui/loader";
import { authAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import Cookies from "js-cookie";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import odelLogo from '@/assets/odel-logo.jpg'





const adminLoginSchema = z.object({
    username: z.string().min(1, "Username or email is required"),
    password: z.string().min(1, "Password is required"),
});
type AdminLoginForm = z.infer<typeof adminLoginSchema>;

const AdminLogin = () => {
    const navigate = useNavigate();
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
                applicant: false,
            });

            if (response.userId && response.roles) {
                const hasAdminRole = response.roles.some(role =>
                    role === 'ADMIN' || role === 'SUPER_ADMIN'
                );

                if (!hasAdminRole) {
                    setError("Access denied. Admin privileges required.");
                    toast({
                        variant: "destructive",
                        title: "Access Denied",
                        description: "You don't have admin privileges.",
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

                Cookies.set('admin_token', response.jwt, { secure: true, sameSite: 'strict' });
                Cookies.set('admin_refresh_token', response.refreshToken, { secure: true, sameSite: 'strict' });
                Cookies.set('admin_user', JSON.stringify({
                    userId: response.userId,
                    roles: response.roles,
                    username: data.username
                }), { secure: true, sameSite: 'strict' });

                toast({
                    title: "Login Successful",
                    description: "Welcome back, Admin!",
                });

                navigate("/admin/dashboard");
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
                                    Admin Login
                                </div>
                            </CardTitle>
                            <p className="text-center text-muted-foreground">
                                Secure access for administrators
                            </p>
                        </CardHeader>

                        <CardContent>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <div className="space-y-2">
                                    <FloatingInput
                                        id="username"
                                        label="Username or Email"
                                        icon={<Mail className="h-4 w-4" />}
                                        {...register("username")}
                                        className="bg-background/50"
                                    />
                                    {errors.username && (
                                        <p className="text-xs text-destructive mt-1">{errors.username.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <div className="relative">
                                        <FloatingInput
                                            id="password"
                                            label="Password"
                                            type={showPassword ? "text" : "password"}
                                            icon={<Lock className="h-4 w-4" />}
                                            {...register("password")}
                                            className="bg-background/50 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors z-20"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
                                    )}
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full font-bold py-6 shadow-lg transition-all"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                                            Authenticating...
                                        </>
                                    ) : (
                                        "Login to Dashboard"
                                    )}
                                </Button>
                            </form>
                        </CardContent>

                        <CardFooter className="flex justify-center text-sm text-muted-foreground">
                            <button
                                type="button"
                                onClick={() => navigate("/api/auth/login")}
                                className="hover:text-foreground transition-colors"
                            >
                                ← Back to Home
                            </button>
                        </CardFooter>
                    </Card>

                </motion.div>
            </div>
        </div>
    );
};

export default AdminLogin;
