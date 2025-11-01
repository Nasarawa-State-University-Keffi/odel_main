import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {  Plus, Minus } from "lucide-react";


export const ProgramAccordion = ({
  title,
  programs,
}: {
  title: string;
  programs: string[];
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full border border-muted/30 rounded-lg bg-card/60 backdrop-blur-sm shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-4 py-3 text-left text-base font-semibold text-primary hover:bg-muted/30 transition-all"
      >
        <span>{title}</span>
        {open ? (
          <Minus size={18} className="text-primary" />
        ) : (
          <Plus size={18} className="text-primary" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden px-6 pb-3 text-sm text-muted-foreground space-y-1"
          >
            {programs.map((prog, index) => (
              <li
                key={index}
                className="border-b border-muted/20 pb-1 last:border-none"
              >
                {prog}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};