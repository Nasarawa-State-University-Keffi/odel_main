import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Link } from "react-router-dom";

const imageLogo = "https://odel.nsuk.edu.ng/wp-content/uploads/2024/02/ODEL.png";

export const Header = () => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const navItems = [
    { name: "Home", path: "/" },
    {
      name: "About Us",
      dropdown: [
        { name: "Odel history", path: "/odel-history" },
        { name: "Vice Chancellor's message", path: "/vice-chancellor-message" },
        { name: "Director's message", path: "/director-message" },
        { name: "Our staff", path: "/our-staff" },
      ],
    },
    {
      name: "Programs",
      dropdown: [
        { name: "B.Sc Public Administration", path: "/public-administration" },
        { name: "Upcoming Programs", path: "/upcoming-programs" },
      ],
    },
    { name: "Admission List", path: "/admissions" },
    { name: "Contact Us", path: "/contact" },
    { name: "FAQ", path: "/faq" },
  ];

  return (
    <header className="sticky top-0 z-50">
      {/* Banner */}
      <div className="bg-secondary text-secondary-foreground py-2 px-4 text-center text-sm font-medium">
        Our pioneer Programme is B.Sc Public Administration
      </div>

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
            <nav className="hidden lg:flex items-center gap-6 relative">
              {navItems.map((item) => (
                <div
                  key={item.name}
                  className="relative group"
                  onMouseEnter={() => item.dropdown && setActiveDropdown(item.name)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  {item.dropdown ? (
                    <span
                      className="relative cursor-pointer text-primary-foreground font-medium transition-colors 
                      after:content-[''] after:absolute after:left-1/2 after:-bottom-1 after:w-0 after:h-[2px]
                      after:bg-[#F8C301] after:transition-all after:duration-300 after:-translate-x-1/2
                      group-hover:after:w-full hover:text-accent"
                    >
                      {item.name}
                    </span>
                  ) : (
                    <Link
                      to={item.path}
                      className="relative text-primary-foreground font-medium transition-colors 
                        after:content-[''] after:absolute after:left-1/2 after:-bottom-1 after:w-0 after:h-[2px]
                        after:bg-[#F8C301] after:transition-all after:duration-300 after:-translate-x-1/2
                        hover:after:w-full hover:text-accent"
                    >
                      {item.name}
                    </Link>
                  )}

                  {/* Dropdown */}
                  {item.dropdown && activeDropdown === item.name && (
                    <div className="absolute left-0 mt-3 w-56 bg-primary text-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 animate-fadeIn">
                      {item.dropdown.map((sub) => (
                        <Link
                          key={sub.name}
                          to={sub.path}
                          className="relative block px-4 py-2 font-medium hover:bg-[#F8C301] hover:text-black transition-colors
                            after:content-[''] after:absolute after:left-1/2 after:bottom-0 after:w-0 after:h-[2px]
                            after:bg-black after:transition-all after:duration-300 after:-translate-x-1/2 hover:after:w-full"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <Link to="/application">
                <Button
                  variant="default"
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  APPLY NOW
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
                  {navItems.map((item) => (
                    <div key={item.name}>
                      <Link
                        to={item.path || "#"}
                        className="text-lg font-medium hover:text-primary transition-colors"
                      >
                        {item.name}
                      </Link>

                      {item.dropdown && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.dropdown.map((sub) => (
                            <Link
                              key={sub.name}
                              to={sub.path}
                              className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <Link to="/application">
                    <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
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
