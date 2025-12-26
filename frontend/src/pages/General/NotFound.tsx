import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-card rounded-2xl shadow-xl border border-border/50 backdrop-blur-sm p-8 md:p-12 text-center space-y-8"
        >
          <div className="relative flex justify-center">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-20 animate-pulse" />
            <div className="relative bg-muted rounded-full p-6 ring-1 ring-border">
              <FileQuestion className="h-12 w-12 text-primary" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Page Not Found
            </h1>
            <p className="text-muted-foreground text-lg">
              Sorry, we couldn't find the page you're looking for. It might have been removed or doesn't exist.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">

            <Link to="/api/auth/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-primary/20">
                <Home className="mr-2 h-4 w-4" />
                Return Home
              </Button>
            </Link>
          </div>

          <div className="pt-8 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Error Code: 404 • Path: <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground/80">{location.pathname}</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
