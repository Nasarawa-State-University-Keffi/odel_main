import { cn } from "@/lib/utils";

interface LoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  fullscreen?: boolean;
  text?: string;
}

export const Loader = ({ className, size = "md", fullscreen = false, text }: LoaderProps) => {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  const content = (
    <>
      <div
        className={cn(
          "rounded-full border-t-primary border-r-primary border-b-transparent border-l-transparent animate-spin",
          sizeClasses[size]
        )}
      />
      {text && <p className="mt-4 text-muted-foreground text-sm">{text}</p>}
    </>
  );

  if (fullscreen) {
    return (
      <div className={cn("flex flex-col items-center justify-center min-h-screen bg-background", className)}>
        {content}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      {content}
    </div>
  );
};
