import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGroupStore } from "@/stores/groupStore";
import { Copy, Check, Share2, UserPlus } from "lucide-react";

interface InviteSheetProps {
  groupId: string;
  inviteCode: string;
  groupName: string;
}

export function InviteSheet({ groupId, inviteCode, groupName }: InviteSheetProps) {
  const [copied, setCopied] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [joinError, setJoinError] = useState("");
  const joinByInvite = useGroupStore((s) => s.joinByInvite);

  const inviteLink = `${window.location.origin}/join?code=${inviteCode}`;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
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

  const handleJoin = async () => {
    setJoinError("");
    const result = await joinByInvite(inviteInput.trim());
    if (result.error) {
      setJoinError(result.error);
    } else {
      setInviteInput("");
    }
  };

  return (
    <div className="space-y-5">
      {/* Share invite code */}
      <div>
        <h3 className="text-sm font-medium mb-2">Код приглашения</h3>
        <div className="flex gap-2">
          <div className="flex-1 bg-muted rounded-lg px-4 py-3 text-center">
            <span className="text-2xl font-mono font-bold tracking-[0.3em] text-primary">
              {inviteCode}
            </span>
          </div>
          <Button variant="outline" size="icon" onClick={copyCode} className="flex-shrink-0">
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          Поделитесь этим кодом с друзьями, чтобы они могли присоединиться к &laquo;{groupName}&raquo;
        </p>
      </div>

      {/* Share link */}
      <div>
        <h3 className="text-sm font-medium mb-2">Ссылка-приглашение</h3>
        <div className="flex gap-2">
          <Input value={inviteLink} readOnly className="text-xs" />
          <Button
            variant="outline"
            size="icon"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(inviteLink);
              } catch {
                // ignore
              }
            }}
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Join a group */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-medium mb-2">Присоединиться к группе</h3>
        <div className="flex gap-2">
          <Input
            placeholder="Введите код приглашения"
            value={inviteInput}
            onChange={(e) => setInviteInput(e.target.value.toUpperCase())}
            className="uppercase"
            maxLength={6}
          />
          <Button onClick={handleJoin} disabled={inviteInput.length < 4}>
            <UserPlus className="w-4 h-4 mr-1" /> Присоединиться
          </Button>
        </div>
        {joinError && <p className="text-xs text-red-500 mt-1">{joinError}</p>}
      </div>
    </div>
  );
}
