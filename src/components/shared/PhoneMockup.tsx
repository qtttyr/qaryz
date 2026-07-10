import { cn } from "@/lib/utils";

interface PhoneMockupProps {
  children: React.ReactNode;
  className?: string;
  scale?: number;
}

export default function PhoneMockup({ children, className, scale = 1 }: PhoneMockupProps) {
  return (
    <div
      className={cn(
        "relative mx-auto w-[240px] h-[500px] rounded-[2.5rem] border-4 border-foreground/10 bg-background shadow-2xl shadow-black/20 overflow-hidden",
        className
      )}
      style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}
    >
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-foreground/10 rounded-b-2xl z-10" />
      {/* Screen */}
      <div className="absolute inset-0 pt-8 pb-4 px-3 flex flex-col">{children}</div>
    </div>
  );
}
