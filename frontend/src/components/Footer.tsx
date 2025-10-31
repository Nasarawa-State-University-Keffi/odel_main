import { Facebook, Twitter, Instagram, Linkedin, Youtube } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg mb-4">About</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-accent transition-colors">Our Story</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Mission & Vision</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Leadership</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Programs</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-accent transition-colors">Public Administration</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Computer Science</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Business Admin</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-accent transition-colors">Apply Now</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Student Portal</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">LMS</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Contact</h3>
            <p className="mb-4">Nasarawa State University<br />Keffi</p>
            <div className="flex gap-4">
              <a href="https://www.facebook.com/share/GeQbjRVnquDncZzX/?mibextid=qi2Omg" className="hover:text-accent transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://x.com/NSUKODeL?t=2rXQmautmJQRQGskHr91FQ&s=09" className="hover:text-accent transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://www.instagram.com/nsukodel?utm_source=qr&igsh=MWpqaXhsMmgwb2RvMA==" className="hover:text-accent transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://odel.nsuk.edu.ng/#" className="hover:text-accent transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="https://odel.nsuk.edu.ng/#" className="hover:text-accent transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
            
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/20 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} - NSUK Open Distance eLearning. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
