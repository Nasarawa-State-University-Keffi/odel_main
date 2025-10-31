import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button"; 
import { Home } from "lucide-react";



const backgroundImage = "https://odel.nsuk.edu.ng/wp-content/uploads/2025/07/nsuk-main-entrance-1.jpg";
const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
   <section
  className="relative flex flex-col items-center justify-center min-h-screen text-center px-6 overflow-hidden"
  style={{
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  }}
>
  {/* Overlay */}
  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

  {/* Content */}
  <div className="relative z-10 text-white max-w-md mx-auto">
    <h1 className="text-[6rem] font-extrabold text-[#F8C301] drop-shadow-md animate-bounce">
      404
    </h1>
    <h2 className="text-2xl md:text-3xl font-semibold mt-4">
      Oops! Page Not Found
    </h2>
    <p className="mt-3 text-gray-200 text-base md:text-lg">
      The page you’re looking for doesn’t exist or might have been moved.
    </p>
    <div className="flex items-center justify-center mt-8">
      <Link to="/">
        <Button className="bg-[#F8C301] hover:bg-[#d9a800] text-black font-semibold px-6 py-3 rounded-full flex items-center gap-2 transition-transform duration-300 hover:scale-105 shadow-md">
          <Home className="h-5 w-5" />
          Return Home
        </Button>
      </Link>
    </div>
  </div>
</section>

  );
};

export default NotFound;
