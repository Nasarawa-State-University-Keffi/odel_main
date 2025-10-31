import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

const events = [
  {
    title: "NUC Approves Commencement of Open Distance e-Learning",
    category: "Events",
    description: "In its bid to further the frontiers of education and make it more accessible to the generality of the public, the program kicks off with B.Sc Public Administration.",
    image: "https://odel.nsuk.edu.ng/wp-content/uploads/2024/06/1-16.jpg",
  },
  {
    title: "Application Now Open",
    category: "Application",
    description: "Applications are now open for the new academic session. Apply now to secure your spot in our distance learning programs.",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop",
  },
  {
    title: "Online Orientation Program",
    category: "Events",
    description: "Join us for an online orientation to learn about our programs, facilities, and the amazing opportunities that await you.",
    image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&h=300&fit=crop",
  },
];

export const EventsSection = () => {
  return (
    <section id="events" className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Events & News</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {events.map((event, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-48 object-cover"
              />
              <CardHeader>
                <Badge className="w-fit mb-2">{event.category}</Badge>
                <CardTitle className="text-xl">{event.title}</CardTitle>
                <CardDescription className="line-clamp-3">
                  {event.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="link" className="p-0">
                  Read More →
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
