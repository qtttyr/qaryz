import { usePeople } from "@/hooks/usePeople";
import PersonCard from "@/components/debts/PersonCard";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, MoneySend01Icon } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function IOwePage() {
  const { iOwe } = usePeople();
  const [search, setSearch] = useState("");

  const filtered = iOwe.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Я должен</h1>
        <p className="text-muted-foreground">Люди, которым вы обещали вернуть деньги</p>
      </header>

      <div className="relative">
        <HugeiconsIcon
          icon={Search01Icon}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={18}
        />
        <Input
          placeholder="Поиск по имени..."
          className="pl-10 h-11 rounded-xl bg-card border-border/50 focus-visible:ring-negative/20"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? (
            filtered.map((person, index) => (
              <PersonCard key={person.id} person={person} index={index} />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mb-4">
                <HugeiconsIcon
                  icon={MoneySend01Icon}
                  size={32}
                  className="text-muted-foreground/50"
                />
              </div>
              <p className="text-muted-foreground font-medium">Вы никому не должны</p>
              <p className="text-muted-foreground/60 text-sm mt-1">
                {search ? "По вашему запросу ничего не найдено" : "Свобода от долгов — это прекрасно!"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
