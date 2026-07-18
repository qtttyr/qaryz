import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGroupStore } from "@/stores/groupStore";
import { EmojiPicker } from "./EmojiPicker";
import { MemberSelector } from "./MemberSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Users, Sparkles } from "lucide-react";

const STEPS = ["Название", "Участники", "Готово"];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -200 : 200,
    opacity: 0,
  }),
};

interface CreateGroupWizardProps {
  onClose: () => void;
}

export function CreateGroupWizard({ onClose }: CreateGroupWizardProps) {
  const navigate = useNavigate();
  const createGroup = useGroupStore((s) => s.createGroup);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("👥");
  const [description, setDescription] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const canProceed = () => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) return true; // members are optional
    return true;
  };

  const nextStep = () => {
    if (!canProceed()) return;
    if (step < STEPS.length - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const handleCreate = async () => {
    if (creating || !name.trim()) return;
    setCreating(true);
    try {
      const groupId = await createGroup(name.trim(), emoji, description);

      // Note: Members will be invited via invite code (current implementation).
      // The group is created with just the creator as member.
      // Members can join via invite code or be added later.
      // For now we create the group and navigate to it.

      onClose();
      navigate(`/groups/${groupId}`);
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Progress bar */}
      <div className="flex gap-1.5">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                i <= step ? "bg-primary" : "bg-muted"
              )}
            />
            <p
              className={cn(
                "text-[10px] font-medium mt-1 transition-colors duration-300",
                i === step
                  ? "text-primary"
                  : i < step
                  ? "text-muted-foreground/60"
                  : "text-muted-foreground/30"
              )}
            >
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="relative overflow-hidden min-h-[280px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="space-y-4"
          >
            {/* Step 1: Name + Emoji */}
            {step === 0 && (
              <>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Название и иконка</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Придумайте название для группы и выберите иконку
                </p>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl">
                    {emoji}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Название группы"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoFocus
                    />
                    <Input
                      placeholder="Описание (необязательно)"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>

                <EmojiPicker value={emoji} onChange={setEmoji} />
              </>
            )}

            {/* Step 2: Members */}
            {step === 1 && (
              <>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Добавить участников</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Выберите друзей, которых хотите добавить в группу. Можно добавить позже по коду приглашения
                </p>

                <MemberSelector
                  selected={selectedMemberIds}
                  onChange={setSelectedMemberIds}
                />
              </>
            )}

            {/* Step 3: Confirm */}
            {step === 2 && (
              <>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-lg font-semibold">Подтверждение</h3>
                </div>

                <div className="rounded-2xl bg-muted/30 p-5 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">
                      {emoji}
                    </div>
                    <div>
                      <p className="font-semibold text-base">{name}</p>
                      {description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Участников</span>
                      <span className="font-medium">1 + {selectedMemberIds.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Код приглашения</span>
                      <span className="font-mono text-xs font-medium text-primary">
                        Будет создан автоматически
                      </span>
                    </div>
                  </div>

                  {selectedMemberIds.length > 0 && (
                    <div className="border-t border-border/50 pt-3">
                      <p className="text-xs text-muted-foreground mb-2">
                        Приглашённые друзья ({selectedMemberIds.length}):
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs text-foreground/70">
                          Они получат доступ по коду приглашения
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-2 pt-2">
        {step > 0 ? (
          <Button variant="outline" onClick={prevStep} className="flex-1">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Назад
          </Button>
        ) : (
          <Button variant="outline" onClick={onClose} className="flex-1">
            Отмена
          </Button>
        )}

        {step < STEPS.length - 1 ? (
          <Button onClick={nextStep} disabled={!canProceed()} className="flex-1">
            Далее <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        ) : (
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || creating}
            className="flex-1"
          >
            {creating ? (
              "Создание..."
            ) : (
              <>
                Создать группу <Sparkles className="w-4 h-4 ml-1.5" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
