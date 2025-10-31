import { Card, CardContent } from "./ui/card";
import { FileText, Calendar, BookOpen, UserCheck, GraduationCap, LogIn } from "lucide-react";

const links = [
  { icon: FileText, title: "Apply Now", href: "#apply" },
  { icon: Calendar, title: "Events", href: "#events" },
  { icon: BookOpen, title: "Library", href: "#library" },
  { icon: UserCheck, title: "Admissions", href: "#admissions" },
  { icon: GraduationCap, title: "LMS", href: "#lms" },
  { icon: LogIn, title: "Portal", href: "#portal" },
];

export const QuickLinks = () => {
  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <a key={link.title} href={link.href}>
                <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer border-2 hover:border-primary">
                  <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
                    <Icon className="h-10 w-10 text-primary" />
                    <h3 className="font-semibold text-center">{link.title}</h3>
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};
