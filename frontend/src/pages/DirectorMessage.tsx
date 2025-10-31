import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { motion } from "framer-motion";
import { useEffect } from "react";



const directorImage =
  "https://odel.nsuk.edu.ng/wp-content/uploads/2024/02/ODEL-DIRECTOR-265x300.jpg";

const DirectorMessage = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <>
      <Header />
      <section
        className="relative min-h-screen bg-gradient-to-b from-[#f9fafb] to-[#f3f4f6] text-gray-800 px-6 md:px-16 py-20 overflow-hidden"
      >
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm"></div>

        <div className="relative max-w-6xl mx-auto">
          {/* Heading */}
          <motion.h1
            className="text-4xl md:text-5xl font-bold text-center mb-12 text-[#1E3A8A]"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            From the Director’s Desk
          </motion.h1>

          {/* Image + Name Card */}
          <motion.div
            className="flex flex-col md:flex-row items-center gap-10 mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 1 }}
          >
            {/* Image Card */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="group relative w-72 h-80 rounded-2xl overflow-hidden shadow-xl transition-all duration-500"
            >
              <img
                src={directorImage}
                alt="Director"
                className="w-full h-full object-cover group-hover:brightness-90 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-4">
                <h2 className="text-white text-lg font-semibold">
                  Prof. Benneth Colman Uzoechi
                </h2>
                <p className="text-gray-200 text-sm">Director, NSUK ODeL</p>
              </div>
            </motion.div>

            {/* Short Intro beside the image */}
            <div className="md:w-3/5 text-center md:text-left">
              <h2 className="text-2xl font-semibold text-[#1E3A8A] mb-2">
                Prof. Benneth Colman Uzoechi
              </h2>
              <p className="text-gray-600 italic mb-4">Director, NSUK ODeL</p>
              <p className="text-gray-700 leading-relaxed">
                The Nasarawa State University Open and Distance eLearning Centre is committed to providing a quality academic open distance eLearning programme to interested candidates in Nigeria and from across the globe.
              </p>
            </div>
          </motion.div>

          {/* Message Content */}
          <motion.div
            className="space-y-6 leading-relaxed text-justify text-lg bg-white/70 backdrop-blur-md p-8 rounded-2xl shadow-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
          >
            <p>
              The Centre is adequately and appropriately positioned to provide up-to-date, learner-friendly, supported, and interactive course materials. These materials were developed by seasoned academics who are experts in their respective disciplines.
            </p>

            <p>
              Each course module contains units and sub-units with clear learning outcomes to guide students. Every sub-unit includes self-assessment exercises that allow learners to evaluate their progress, along with reference lists for further reading and possible answers.
            </p>

            <p>
              The materials are designed for independent learning and facilitation, enabling students separated by distance to effectively study at their own pace while maintaining contact with tutors and facilitators when needed.
            </p>

            <p>
              The Centre also offers a well-equipped guidance, counselling, and student-support unit to assist learners whenever required. On behalf of the Vice Chancellor, Prof. Suleman B. Mohammed, I sincerely appreciate the developers and editors for their dedication in producing these high-quality materials.
            </p>

            <p>
              I strongly recommend these materials to all our students and wish them the very best as they pursue their studies with dedication and excellence.
            </p>

            <p>
              My sincere appreciation also goes to the Vice Chancellor and the management team for their continuous support, ensuring that the necessary materials and personnel are available for our students.
            </p>

            <p>
              I wish all our students an engaging, interesting, and successful study experience.
            </p>
          </motion.div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default DirectorMessage;
