import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

const imageLogo = "https://odel.nsuk.edu.ng/wp-content/uploads/2024/06/1-16.jpg";

const faqs = [
  {
    question: "How do I apply?",
    answer:
      "Click on Apply Now and fill out the application form. The process is simple and straightforward.",
  },
  {
    question: "What is the duration of the programme?",
    answer:
      "Four (4) years for UTME candidates (8 semesters), Three (3) years for DIRECT ENTRY (6 semesters), and Two (2) years for 300 Level HND/BSC candidates (4 semesters).",
  },
  {
    question: "Which courses can I apply for?",
    answer:
      "Our Pioneer programme is B.Sc in Public Administration. Proposed new programmes include Computer Sciences, Business Administration, Accounting, Entrepreneurship, and Economics.",
  },
  {
    question: "Does it have an age limit?",
    answer: "No, there is no age limit for our distance learning programmes.",
  },
  {
    question: "Do I have to be present in the University?",
    answer:
      "No, you can learn from your location. That's the beauty of distance learning!",
  },
  {
    question: "What is the examination format?",
    answer: "All our exams are purely Computer-Based Testing (CBT).",
  },
];

export const FAQSection = () => {
  return (
    <section id="faq" className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center relative">
          Frequently Asked Questions
          <span className="absolute left-1/2 -bottom-2 w-24 h-1 bg-[#F8C301] -translate-x-1/2"></span>
        </h2>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* FAQ Accordion */}
          <div className="m-12"> 
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left font-semibold">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Image Column */}
          <div className="flex justify-center">
          <div className="relative group w-80 h-80 rounded-2xl overflow-hidden shadow-lg transition-transform duration-500 hover:scale-105 hover:shadow-2xl">
            <img
              src={imageLogo}
              alt="FAQ Image"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-lg font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              VC: Professor Sa'adatu Hassan Liman
            </div>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
};
