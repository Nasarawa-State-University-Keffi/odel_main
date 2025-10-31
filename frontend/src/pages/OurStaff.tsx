import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { useEffect } from "react";

interface StaffMember {
  name: string;
  title: string;
  image: string;
}

const staffMembers: StaffMember[] = [
  {
    name: "Prof. Benneth Colman Uzoechi",
    title: "Director",
    image: "https://odel.nsuk.edu.ng/wp-content/uploads/2024/02/ODEL-DIRECTOR-265x300.jpg",
  },
  {
    name: "Prof. Rasheedat Funke Olariwaju",
    title: "Deputy Director",
    image: "https://via.placeholder.com/300x350?text=Prof.+Rasheedat+Funke+Olariwaju",
  },
  {
    name: "Dr. Odonye Dauda Yusuf",
    title: "Programme Coordinator",
    image: "https://via.placeholder.com/300x350?text=Dr.+Odonye+Dauda+Yusuf",
  },
  {
    name: "Dr. Iya Haruna Ayuba",
    title: "Head, Guidance and Counselling",
    image: "https://via.placeholder.com/300x350?text=Dr.+Iya+Haruna+Ayuba",
  },
  
  {
    name: "Mrs. Hajara J Garba",
    title: "ICT Coordinator",
    image: "https://odel.nsuk.edu.ng/wp-content/uploads/2025/03/HAJO-768x1024.jpg",
  },
  {
    name: "Dama Williams Yohanna",
    title: "ODeL Webmaster/DB Analyst",
    image: "https://odel.nsuk.edu.ng/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-26-at-7.33.40-AM.jpeg",
  },
  {
    name: "Mr. Ibrahim Liman",
    title: "ODeL Help Desk Officer",
    image: "https://odel.nsuk.edu.ng/wp-content/uploads/2025/03/ibro-1018x1024.jpeg",
  },
  {
    name: "Mrs. Zainab Maikasuwa",
    title: "ODeL Secretary",
    image: "https://odel.nsuk.edu.ng/wp-content/uploads/2025/03/WhatsApp-Image-2025-03-05-at-3.12.03-AM.jpeg",
  },
    {
    name: ".Dr. Yakubu Jacob Umaru",
    title: "Programmes & Editorial Coordinator",
    image: "https://odel.nsuk.edu.ng/wp-content/uploads/2025/04/WhatsApp-Image-2025-04-15-at-4.59.41-AM-768x1024.jpeg",
  },
  {
    name: "Mr. Kumiyawo James Ayinda",
    title: "Finance Officer",
    image: "https://odel.nsuk.edu.ng/wp-content/uploads/2025/04/WhatsApp-Image-2025-04-14-at-3.44.57-AM-1-768x1024.jpeg",
  },
  {
    name: "Mr. Abdulwahab Idris Ewa",
    title: "Data Processing Officer",
    image: "https://odel.nsuk.edu.ng/wp-content/uploads/2025/04/WhatsApp-Image-2025-04-14-at-2.51.33-AM.jpeg",
  },
  {
    name: "Mr. Sini Obidah",
    title: "E-Tutor",
    image: "https://odel.nsuk.edu.ng/wp-content/uploads/2025/04/WhatsApp-Image-2025-04-03-at-4.26.40-AM-731x1024.jpeg",
  },

  {
    name: ".Dr. Ossai Onyeka Peter",
    title: "E-Tutor",
    image: "https://odel.nsuk.edu.ng/wp-content/uploads/2025/04/WhatsApp-Image-2025-04-14-at-4.58.20-AM-767x1024.jpeg",
  },
];

const OurStaff = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const isAcademic = (name: string) =>
    name.startsWith("Prof.") || name.startsWith("Dr.");

  const academicStaff = staffMembers.filter((m) => isAcademic(m.name));
  const nonAcademicStaff = staffMembers.filter((m) => !isAcademic(m.name));

  return (
    <>
      <Header />
      <section className="relative min-h-screen bg-gradient-to-b from-[#f9fafb] to-[#f3f4f6] px-6 md:px-16 py-20 text-gray-800 overflow-hidden">
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm"></div>

        <div className="relative max-w-7xl mx-auto">
          {/* Title */}
          <motion.h1
            className="text-4xl md:text-5xl font-bold text-center mb-16 text-[#1E3A8A]"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            Our Staff
          </motion.h1>

          {/* === Academic Staff Section === */}
          <h2 className="text-2xl font-semibold text-[#1E3A8A] mb-8 text-center">
            Academic Staff
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 mb-16">
            {academicStaff.map((staff, index) => (
              <StaffCard
                key={index}
                staff={staff}
                academic
                delay={index * 0.1}
              />
            ))}
          </div>

          {/* Divider Line */}
          <div className="relative my-10 flex items-center justify-center">
            <div className="h-px bg-gray-300 w-full"></div>
            <span className="absolute bg-[#f9fafb] px-4 text-gray-500 text-sm uppercase tracking-wider">
              Non-Academic Staff
            </span>
          </div>

          {/* === Non-Academic Staff Section === */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {nonAcademicStaff.map((staff, index) => (
              <StaffCard
                key={index}
                staff={staff}
                academic={false}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

const StaffCard = ({
  staff,
  academic,
  delay,
}: {
  staff: StaffMember;
  academic: boolean;
  delay: number;
}) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    initial={{ opacity: 0, x: -100 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.8, delay }}
    className={`group relative rounded-2xl overflow-hidden transition-all duration-500 shadow-lg ${
      academic
        ? "bg-gradient-to-br from-[#fff7e6] to-[#fefefe] border-t-4 border-yellow-500"
        : "bg-white/70 backdrop-blur-md"
    }`}
  >
    {/* Image */}
    <img
      src={staff.image}
      alt={staff.name}
      className={`w-full h-80 object-cover ${
        academic ? "group-hover:brightness-95" : "group-hover:brightness-90"
      } transition-all duration-500`}
    />

    {/* Hover Overlay */}
    <div
      className={`absolute inset-0 bg-gradient-to-t ${
        academic ? "from-yellow-800/70" : "from-black/60"
      } to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-4`}
    >
      <h2 className="text-white text-lg font-semibold">{staff.name}</h2>
      <p className="text-gray-200 text-sm">{staff.title}</p>
    </div>

    {/* Static Text */}
    <div className="p-4 text-center">
      <h3
        className={`text-lg font-semibold ${
          academic ? "text-yellow-800" : "text-[#1E3A8A]"
        }`}
      >
        {staff.name}
      </h3>
      <p className="text-gray-600 text-sm">{staff.title}</p>
    </div>
  </motion.div>
);

export default OurStaff;
