import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface EmojiCategory {
  name: string;
  emojis: string[];
}

const CATEGORIES: EmojiCategory[] = [
  {
    name: "Люди",
    emojis: ["👥", "👤", "👨‍👩‍👧‍👦", "🤝", "💑", "👋", "✋", "🙌", "💪", "🧑‍🤝‍🧑", "👭", "👬"],
  },
  {
    name: "Активности",
    emojis: ["🎉", "🎊", "🎯", "🎪", "🎭", "🎨", "🎵", "🎬", "🎮", "🎲", "🎳", "🏓"],
  },
  {
    name: "Путешествия",
    emojis: ["🚗", "✈️", "🚀", "🏖️", "🏔️", "🏕️", "🗺️", "🌍", "🌴", "⛰️", "🚢", "🚲"],
  },
  {
    name: "Еда",
    emojis: ["🍕", "🍔", "🍜", "🍣", "🥗", "🌮", "🍝", "🥘", "🍰", "🍩", "☕", "🍻"],
  },
  {
    name: "Дом",
    emojis: ["🏠", "🛒", "🏪", "🏢", "🏫", "🏥", "🏦", "🏗️", "🛋️", "🧹", "🔧", "🌿"],
  },
  {
    name: "Развлечения",
    emojis: ["📚", "💻", "📱", "🎧", "📸", "🎥", "🖥️", "🎤", "🎸", "🏀", "⚽", "🎱"],
  },
  {
    name: "Покупки",
    emojis: ["🛍️", "👕", "👟", "⌚", "💎", "🌸", "🎁", "💄", "👜", "🧸", "📦", "🏷️"],
  },
  {
    name: "Прочее",
    emojis: ["📌", "💡", "🔐", "📊", "📈", "⭐", "💝", "🔥", "💎", "🌈", "🎀", "🔮"],
  },
];

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <div className="space-y-3">
      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {CATEGORIES.map((cat, i) => (
          <button
            key={cat.name}
            onClick={() => setActiveCategory(i)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
              activeCategory === i
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="grid grid-cols-6 gap-1.5">
        {CATEGORIES[activeCategory].emojis.map((emoji, i) => (
          <motion.button
            key={emoji}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15, delay: i * 0.025 }}
            onClick={() => onChange(emoji)}
            className={cn(
              "w-full aspect-square rounded-xl flex items-center justify-center text-xl sm:text-2xl transition-all duration-150",
              "hover:bg-muted hover:scale-110 active:scale-95",
              value === emoji
                ? "bg-primary/15 ring-2 ring-primary/40 scale-110"
                : "bg-transparent"
            )}
          >
            {emoji}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
