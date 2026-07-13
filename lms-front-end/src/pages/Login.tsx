import { useState } from "react";
import { GraduationCap, Loader2, ChevronRight, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AnimateIn } from "@/components/ui/animate-in";
import { useAuth } from "@/service/useAuth";

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { handleSignin } = useAuth()

  const handleSSOLogin = () => {
    setIsLoading(true);
    handleSignin({ username: "", password: "" });
  };

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2 bg-white dark:bg-zinc-950">

      {/* Image Branding & Hero Panel */}
      <div className="hidden relative flex-col lg:flex justify-between overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          //style={{ backgroundImage: "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop')" }}
          style={{ backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/2/25/Gate_of_Nassarawa_State_University.jpg')" }}
        />
        <div className="absolute inset-0 bg-zinc-950/60 mix-blend-multiply" />
        <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/80 to-transparent" />

        {/* Logo */}
        <AnimateIn direction="down" className="relative z-20 p-10">
          <div className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/20">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            LMS Portal
          </div>
        </AnimateIn>

        {/* Decorative Graphic */}
        <AnimateIn direction="up" delay={0.4} className="relative z-20 p-10 mt-auto">
          <blockquote className="space-y-6">
            <p className="text-4xl text-white font-medium leading-tight font-heading tracking-tight">
              "Empowering the next generation of innovators with borderless education."
            </p>
            <footer className="text-sm text-emerald-400 font-medium">
              Nasarawa State University, Keffi &copy; 2026
            </footer>
          </blockquote>
        </AnimateIn>
      </div>

      {/* RIGHT SIDE: The Login UI */}
      <div className="flex items-center justify-center p-8 lg:p-12 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 dark:bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="mx-auto w-full max-w-[420px] space-y-8 relative z-10">

          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-3 text-2xl font-bold tracking-tight mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            LMS Portal
          </div>

          <AnimateIn delay={0.1} direction="up" className="space-y-3 text-left">
            <h1 className="text-3xl font-heading font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Welcome back
            </h1>
            <div className="flex items-start gap-2 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
              <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed">
                Authentication is securely handled by the central university network. Click below to sign in using your portal credentials.
              </p>
            </div>
          </AnimateIn>

          <AnimateIn delay={0.2} direction="up">
            <Button
              onClick={handleSSOLogin}
              className="w-full h-14 text-base font-medium bg-zinc-900 hover:bg-zinc-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Redirecting to Authentik...
                </>
              ) : (
                <>
                  Sign In with NSUK Portal
                  <ChevronRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </AnimateIn>

          {/* Footer links */}
          <AnimateIn delay={0.3} direction="up">
            <p className="text-center text-sm text-zinc-500 mt-8">
              Need help logging in? <a href="#" className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline underline-offset-4 transition-all">Contact IT Support</a>
            </p>
          </AnimateIn>

        </div>
      </div>
    </div>
  );
};

export default Login;