import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { motion } from "framer-motion";
import { useEffect } from "react";

const vcImage =
  "https://odel.nsuk.edu.ng/wp-content/uploads/2024/06/1-16-240x300.jpg"; 

const ViceChancellorMessage = () => {
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
          Vice Chancellor&apos;s Message
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
              src={vcImage}
              alt="Vice Chancellor"
              className="w-full h-full object-cover group-hover:brightness-90 transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-4">
              <h2 className="text-white text-lg font-semibold">
                Prof. Sa’adatu Hassan Liman
              </h2>
              <p className="text-gray-200 text-sm">Vice Chancellor</p>
            </div>
          </motion.div>

          {/* Short Intro beside the image */}
          <div className="md:w-3/5 text-center md:text-left">
            <h2 className="text-2xl font-semibold text-[#1E3A8A] mb-2">
              Prof. Sa’adatu Hassan Liman
            </h2>
            <p className="text-gray-600 italic mb-4">Vice Chancellor</p>
            <p className="text-gray-700 leading-relaxed">
              It is my singular pleasure and honour to welcome you to Nasarawa
              State University, Keffi. Over the past 23 years, our institution
              has upheld excellence in teaching, research, and community service.
              We continue to innovate and adapt in line with global educational
              trends, ensuring access to quality education through our Open and
              Distance e-Learning (ODeL) initiative.
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
            Nasarawa State University, Keffi was established in 2001 under the
            Nasarawa State Law No. 2 of 2001 as passed by the State House of
            Assembly. The University was founded upon the philosophy of
            “believing in excellence, creativity, productivity, and freedom of
            conscience for the advancement of individuals and humanity.” The
            mandate of the University is to pursue and foster “knowledge for
            development.” Nasarawa State University has been at the forefront of
            entrenching quality and functional university education.
          </p>

          <p>
            In its 23 years of existence, the University has developed and
            institutionalized a tradition of excellence in fulfilling its vision
            and mission of producing well-grounded graduates who are morally and
            academically sound, equipped with appropriate skills and competencies
            for the 21st-century world.
          </p>

          <p>
            In keeping with global trends, the University is reappraising its
            structures, policies, and processes in line with its vision and
            aspirations of its founding fathers to reposition itself for the
            educational challenges of the modern world.
          </p>

          <p>
            The University recognizes that face-to-face learning alone cannot
            meet the demand for higher education among Nigeria’s growing
            population. Hence, it seeks to harness the power of information and
            communication technology (ICT) to expand access through open and
            distance learning.
          </p>

          <p>
            The Open and Distance e-Learning (ODeL) model at Nasarawa State
            University leverages multimedia technologies to support e-learning
            and independent learning. Physical contact will be minimal while
            processes such as admission, payment, and lecture delivery will be
            fully automated through a world-class Student Information System
            (SIS).
          </p>

          <p>
            This hybrid learning mode will deliver academic programmes to global
            students synchronously or asynchronously, ensuring quality education
            for all regardless of time or place.
          </p>

          <p>
            It is my honour to welcome you to our Open Distance e-Learning
            programme and to wish you a pleasant, engaging, and fulfilling study
            experience with Nasarawa State University, Keffi.
          </p>
        </motion.div>
      </div>
    </section>
    <Footer />
    </>
  );
};

export default ViceChancellorMessage;
