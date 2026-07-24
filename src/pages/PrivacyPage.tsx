import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3 px-4 h-12">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold">Политика конфиденциальности</h1>
        </div>
      </div>
      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex-1 overflow-y-auto"
      >
        <iframe
          src="/privacy-policy.html"
          className="w-full h-full border-0"
          title="Политика конфиденциальности"
        />
      </motion.div>
    </div>
  );
}