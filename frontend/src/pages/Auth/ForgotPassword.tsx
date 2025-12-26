import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { Mail, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, useAnimation } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";


const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast({
                title: "Email Required",
                description: "Please enter your email address",
                variant: "destructive",
            });
            shakeForm();
            return;
        }

        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            setIsSubmitted(true);
            toast({
                title: "Reset Link Sent",
                description: "Check your email for password reset instructions",
            });
        }, 1500);
    };

    const handleReset = () => {
        setEmail("");
        setIsSubmitted(false);
    };

    if (isSubmitted) {
        return (
            <div className="min-h-[100dvh] w-full flex items-center justify-center relative overflow-hidden bg-background">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none z-0" />
                <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md px-6"
                >
                    <Card className="w-full rounded-3xl border-border/50 shadow-2xl bg-card/60 backdrop-blur-xl flex flex-col overflow-hidden">
                        <CardContent className="px-8 py-10 flex flex-col items-center">
                            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 ring-4 ring-primary/5">
                                <CheckCircle className="h-10 w-10 text-primary" />
                            </div>

                            <h2 className="text-2xl font-black tracking-tighter text-foreground uppercase text-center mb-2">
                                Check Your Email
                            </h2>
                            <p className="text-center text-muted-foreground font-medium text-sm mb-8">
                                We've sent password reset instructions to <br />
                                <span className="text-primary font-bold">{email}</span>
                            </p>

                            <div className="w-full space-y-3">
                                <Button
                                    onClick={handleReset}
                                    variant="outline"
                                    className="w-full h-12 rounded-xl border-primary/20 hover:bg-primary/5 hover:text-primary font-bold tracking-wide"
                                >
                                    Try Another Email
                                </Button>

                                <Button
                                    variant="ghost"
                                    onClick={() => window.location.href = '/login'}
                                    className="w-full text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                                >
                                    Return to Login
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    }

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
                                    <div className="relative h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center border-2 border-background shadow-lg">
                                        <Mail className="h-8 w-8 text-primary" />
                                    </div>
                                </motion.div>
                                <CardTitle className="text-center">
                                    <span className="block text-2xl font-black tracking-tighter text-foreground uppercase">
                                        Forgot Password?
                                    </span>
                                    <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mt-2 max-w-[200px] mx-auto leading-relaxed">
                                        Enter your email to receive reset instructions
                                    </span>
                                </CardTitle>
                            </div>
                        </CardHeader>

                        <CardContent className="px-8 pb-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <div className="group transition-all">
                                        <FloatingInput
                                            label="Email Address"
                                            type="email"
                                            icon={<Mail className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="bg-background/40 border-border/50 h-14 rounded-2xl group-focus-within:border-primary/50 group-focus-within:ring-primary/20"
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary hover:bg-primary/90"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Sending Link...
                                        </div>
                                    ) : (
                                        "Send Reset Link"
                                    )}
                                </Button>
                            </form>
                        </CardContent>

                        <CardFooter className="flex justify-center pb-8 border-t border-border/10 pt-6">
                            <Link
                                to="/api/auth/admin/login"
                                className="flex items-center text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors gap-2"
                            >
                                <ArrowLeft className="h-3 w-3" />
                                Back to Login
                            </Link>
                        </CardFooter>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
};

export default ForgotPassword;
