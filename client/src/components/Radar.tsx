import { motion } from "framer-motion";

export function Radar() {
  return (
    <div className="relative w-32 h-32 mx-auto mb-6 opacity-80">
      <div className="absolute inset-0 rounded-full border-2 border-primary/20 bg-primary/5" />
      <div className="absolute inset-0 rounded-full border border-primary/10 scale-50" />
      <div className="absolute inset-0 rounded-full border border-primary/10 scale-150 opacity-20" />
      
      {/* Scanning line */}
      <motion.div
        className="absolute w-[50%] h-[2px] bg-gradient-to-r from-transparent to-primary top-1/2 left-1/2 origin-left"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        style={{ borderRadius: "0 100% 100% 0" }}
      />
      
      {/* Blip */}
      <motion.div
        className="absolute top-1/4 right-1/4 w-3 h-3 bg-accent rounded-full shadow-lg shadow-accent/50"
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
      />
    </div>
  );
}
