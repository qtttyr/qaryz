import { motion } from "framer-motion";

export default function PageLoader() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto"
        >
          <span className="text-3xl font-black text-primary">Q</span>
        </motion.div>
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
}
