import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

const courses = [
  {
    code: "PAD111",
    title: "Introduction to Public Administration I",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop",
  },
  {
    code: "ECO111",
    title: "Principles of Economics I",
    image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=250&fit=crop",
  },
  {
    code: "ACC111",
    title: "Introduction to Accounting",
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=250&fit=crop",
  },
];

export const CoursesSection = () => {
  return (
    <section id="programs" className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Our Courses</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {courses.map((course, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1">
              <img
                src={course.image}
                alt={course.title}
                className="w-full h-40 object-cover"
              />
              <CardHeader>
                <CardTitle className="text-lg">{course.code}</CardTitle>
                <CardDescription>{course.title}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="text-center">
          <Button size="lg" variant="outline" className="font-semibold">
            Browse All Courses
          </Button>
        </div>
      </div>
    </section>
  );
};
