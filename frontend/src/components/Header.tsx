import { Menu } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Link } from "react-router-dom";

const imageLogo = "https://odel.nsuk.edu.ng/wp-content/uploads/2024/02/ODEL.png";

export const Header = () => {
  const navItems = [{ name: "Home", path: "/" }];

  return (
    <header className="sticky top-0 z-50">
      {/* Navbar */}
      <div className="bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            
            {/* Logo */}
            <div className="flex items-center gap-4">
              <Link to="/">
                <img
                  src={imageLogo}
                  alt="Logo"
                  width={200}
                  height={200}
                  className="object-contain"
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">

              <Link to="/login">
                <Button
                  variant="default"
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  Login
                </Button>
              </Link>

              <Link to="/register">
                <Button
                  variant="default"
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  Register
                </Button>
              </Link>
            </nav>

            {/* Mobile Navigation */}
            <Sheet>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="text-primary-foreground">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>

              <SheetContent>
                <nav className="flex flex-col gap-4 mt-8">
                  <Link to="/register">
                    <Button className="bg-accent text-accent-foreground hover:bg-accent/90 w-full">
                      APPLY NOW
                    </Button>
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};
