import { motion } from "framer-motion";
import Logo from "../../public/odel.png"

const Loader = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-background via-muted/40 to-background backdrop-blur-sm z-50">
      {/* Animated logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative flex items-center justify-center"
      >
        <motion.img
          src={Logo}
          alt="ODEL Logo"
          className="w-28 h-28 object-contain"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: [0.9, 1.05, 1], opacity: 1 }}
          transition={{
            duration: 1.5,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "mirror",
          }}
        />

        {/* Pulsating ring around logo */}
        <motion.span
          className="absolute w-40 h-40 rounded-full border-4 border-primary/20"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.8, 0.3, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* Subtext */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.7 }}
        className="mt-6 text-muted-foreground text-sm tracking-wide"
      >
        Loading portal...
      </motion.p>
    </div>
  );
};

export default Loader;
