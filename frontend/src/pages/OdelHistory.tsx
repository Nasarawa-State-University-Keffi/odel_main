import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { motion } from "framer-motion";
import { useEffect } from "react";

const OdelHistory = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return ( 
    <>
    
  <Header />
    <section className="relative min-h-screen bg-gradient-to-b from-[#f9fafb] to-[#f3f4f6] text-gray-800 px-6 md:px-16 py-20">
      {/* Decorative background */}
     
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10 blur-sm"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1500&q=80')",
        }}
      ></div>

      <div className="relative max-w-5xl mx-auto">
        {/* Heading */}
        <motion.h1
          className="text-4xl md:text-5xl font-bold text-center mb-12 text-[#1E3A8A]"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Our Humble Beginning
        </motion.h1>

        {/* Main Text */}
        <motion.div
          className="space-y-6 leading-relaxed text-justify text-lg bg-white/70 backdrop-blur-md p-8 rounded-2xl shadow-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 1 }}
        >
          <p>
            Nasarawa State University, Keffi was established in 2001 under the
            Nasarawa State Law No. 2 of 2001 as passed by the State House of
            Assembly. The university was founded upon the philosophy of
            “believing in excellence, creativity, productivity, and freedom of
            conscience for the advancement of individual and humanity.” Its
            mandate is to pursue and foster “knowledge for development.”
          </p>

          <p>
            Guided by this vision, the administration seeks to make Nasarawa
            State University a 21st-century academic giant and pacesetter in
            teaching, research, and innovation — tailored towards
            people-oriented community service, national development, global
            visibility, and competitiveness.
          </p>

          <h2 className="text-2xl font-semibold text-[#1E3A8A] mt-6">
            Vision & Mission
          </h2>
          <p>
            The vision of the University is “to be a world-class centre of
            excellence for the development of the individual and society,” and
            its mission is to provide and promote qualitative, innovative, and
            stimulating teaching, learning, and research environments to enable
            individuals to develop their full potential for efficient, effective,
            dedicated, and selfless service to the state, the nation, and
            humanity.
          </p>

          <h2 className="text-2xl font-semibold text-[#1E3A8A] mt-6">
            Goals & Core Functions
          </h2>
          <p>
            The goals and objectives of the University are premised on its core
            functions of teaching, learning, research, community service,
            partnerships, and collaboration. In keeping with global trends, the
            University is reappraising and re-examining its structure, policies,
            and processes to improve performance and align with its vision and
            mission.
          </p>

          <h2 className="text-2xl font-semibold text-[#1E3A8A] mt-6">
            Expanding Access to Education
          </h2>
          <p>
            From inception till now, the University has focused on face-to-face
            programme delivery. However, this mode alone cannot meet the high
            demand for tertiary education among Nigeria’s over 200 million
            citizens. With an ever-increasing demand for admission, the
            University recognizes the need to leverage Information and
            Communications Technology (ICT) to expand access.
          </p>

          <p>
            The University understands that the future of education will be
            defined not only by physical infrastructure but by innovative
            deployment of ICT in teaching, learning, and research. This has
            driven the establishment of the Open and Distance Learning (ODL)
            initiative.
          </p>

          <h2 className="text-2xl font-semibold text-[#1E3A8A] mt-6">
            Towards Open & Distance Learning
          </h2>
          <p>
            In line with the Nigerian National Policy on Education (2004),
            Nasarawa State University has recognized the role of Open and
            Distance Learning in achieving lifelong education. The University
            Senate and Governing Council have approved the establishment of an
            Open and Distance Learning Centre to promote flexible, global, and
            inclusive learning opportunities.
          </p>

          <p>
            The ODL model will leverage multimedia technologies that support
            electronic instructional delivery (e-learning) and independent
            learning. All learning processes, including application, admission,
            payment, and lectures, will be automated using a world-class Student
            Information System (SIS).
          </p>

          <p>
            This blended model will deliver selected academic programmes to
            global learners synchronously or asynchronously, ensuring access to
            quality education regardless of location, time, or circumstance.
          </p>
        </motion.div>
      </div>
    </section>
    <Footer />
    </>
  );
};

export default OdelHistory;
