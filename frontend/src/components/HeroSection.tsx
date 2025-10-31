"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

const images = [
  "https://odel.nsuk.edu.ng/wp-content/uploads/2025/07/nsuk-main-entrance-1.jpg",
  "https://odel.nsuk.edu.ng/wp-content/uploads/2025/08/senate1-1.jpg",
  "https://odel.nsuk.edu.ng/wp-content/uploads/2025/08/IMG-20250125-WA00092-1536x1152-1.jpg",
  "https://odel.nsuk.edu.ng/wp-content/uploads/2025/09/WhatsApp-Image-2025-09-24-at-7.43.57-AM-1.jpeg",
  "https://odel.nsuk.edu.ng/wp-content/uploads/2024/07/CBT-HALL.jpg",
  "https://odel.nsuk.edu.ng/wp-content/uploads/2025/08/the-team-1-1536x712.jpg",
];

export const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % images.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);

  // Auto slide logic (ping-pong direction)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        let next = prev + direction;
        if (next >= images.length) {
          setDirection(-1);
          next = images.length - 2;
        } else if (next < 0) {
          setDirection(1);
          next = 1;
        }
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [direction]);

  return (
    <section className="relative h-[500px] md:h-[600px] overflow-hidden">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentSlide}
          className="absolute inset-0"
          custom={direction}
          initial={{ x: direction > 0 ? 300 : -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: direction > 0 ? -300 : 300, opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <img
            src={images[currentSlide]}
            alt={`Slide ${currentSlide + 1}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-md"
        onClick={prevSlide}
      >
        <ChevronLeft className="h-8 w-8" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-md"
        onClick={nextSlide}
      >
        <ChevronRight className="h-8 w-8" />
      </Button>

      {/* Dots indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentSlide ? "bg-white w-8" : "bg-white/50"
            }`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </section>
  );
};
