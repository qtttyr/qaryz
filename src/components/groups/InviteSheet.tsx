import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGroupStore } from "@/stores/groupStore";
import { Copy, Check, UserPlus, Share2 } from "lucide-react";

interface InviteSheetProps {
  groupId: string;
  inviteCode: string;
  groupName: string;
}

export function InviteSheet({ groupId: _groupId, inviteCode, groupName }: InviteSheetProps) {
  const [copied, setCopied] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinSuccess, setJoinSuccess] = useState(false);
  const joinByInvite = useGroupStore((s) => s.joinByInvite);

  const inviteLink = `${window.location.origin}/join?code=${inviteCode}`;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = inviteCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = inviteLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Присоединяйся к "${groupName}" в Qaryz`,
          text: `Я добавил тебя в группу "${groupName}" в Qaryz. Код приглашения: ${inviteCode}`,
          url: inviteLink,
        });
      } catch {
        // user cancelled
      }
    } else {
      copyLink();
    }
  };

  const handleJoin = async () => {
    setJoinError("");
    setJoinSuccess(false);
    const result = await joinByInvite(inviteInput.trim());
    if (result.error) {
      setJoinError(result.error);
    } else {
      setJoinSuccess(true);
      setInviteInput("");
      setTimeout(() => setJoinSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-5">
      {/* Invite code — big visual card */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-5 text-center">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
          Код приглашения
        </p>
        <div className="text-3xl font-mono font-bold tracking-[0.15em] text-primary mb-3 select-all">
          {inviteCode}
        </div>
        <div className="flex gap-2 justify-center">
          <Button variant="secondary" size="sm" onClick={copyCode} className="gap-1.5">
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Скопировано" : "Копировать код"}
          </Button>
          <Button variant="secondary" size="sm" onClick={shareLink} className="gap-1.5">
            <Share2 className="w-3.5 h-3.5" />
            Поделиться
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Отправьте этот код друзьям — они смогут присоединиться к &laquo;{groupName}&raquo;
      </p>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">или</span>
        </div>
      </div>

      {/* Join section */}
      <div>
        <p className="text-sm font-medium mb-2">Присоединиться по коду</p>
        <div className="flex gap-2">
          <Input
            placeholder="Введите код"
            value={inviteInput}
            onChange={(e) => setInviteInput(e.target.value.toUpperCase())}
            className="uppercase font-mono tracking-widest h-10"
            maxLength={6}
          />
          <Button
            onClick={handleJoin}
            disabled={inviteInput.length < 4}
            className="h-10 gap-1.5"
          >
            <UserPlus className="w-4 h-4" /> Войти
          </Button>
        </div>
        {joinError && (
          <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
            <span>⚠</span> {joinError}
          </p>
        )}
        {joinSuccess && (
          <p className="text-xs text-emerald-500 mt-1.5 flex items-center gap-1">
            <span>✓</span> Вы присоединились к группе!
          </p>
        )}
      </div>
    </div>
  );
}
