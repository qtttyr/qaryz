import { useState } from "react";
import { useFriendStore } from "@/stores/friendStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getInitials, getAvatarColor } from "@/lib/formatters";
import { Check, X, Loader2 } from "lucide-react";

export function FriendRequests() {
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const incoming = useFriendStore((s) => s.incomingRequests);
  const outgoing = useFriendStore((s) => s.outgoingRequests);
  const acceptRequest = useFriendStore((s) => s.acceptRequest);
  const rejectRequest = useFriendStore((s) => s.rejectRequest);
  const cancelRequest = useFriendStore((s) => s.cancelRequest);

  const withGuard = (reqId: string, fn: () => void) => {
    if (processing[reqId]) return;
    setProcessing((prev) => ({ ...prev, [reqId]: true }));
    try { fn(); } finally { setProcessing((prev) => ({ ...prev, [reqId]: false })); }
  };

  if (incoming.length === 0 && outgoing.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Incoming requests */}
      {incoming.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
            Заявки в друзья ({incoming.length})
          </p>
          <div className="space-y-1.5">
            {incoming.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-primary/5 border border-primary/10"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-muted">
                  {req.avatar ? (
                    <img src={req.avatar} alt={req.name || ""} className="w-full h-full object-cover" />
                  ) : (
                    <div className={cn(
                      "w-full h-full flex items-center justify-center text-xs font-bold text-white",
                      getAvatarColor(req.name || "Пользователь")
                    )}>
                      {getInitials(req.name || "Пользователь")}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{req.name || "Пользователь"}</p>
                  <p className="text-xs text-muted-foreground truncate">@{req.username}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="default"
                    className="h-8 w-8 p-0"
                    disabled={processing[req.id]}
                    onClick={() => withGuard(req.id, () => acceptRequest(req.id))}
                  >
                    {processing[req.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    disabled={processing[req.id]}
                    onClick={() => withGuard(req.id, () => rejectRequest(req.id))}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outgoing requests */}
      {outgoing.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
            Исходящие заявки
          </p>
          <div className="space-y-1.5">
            {outgoing.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-muted">
                  {req.avatar ? (
                    <img src={req.avatar} alt={req.name || ""} className="w-full h-full object-cover" />
                  ) : (
                    <div className={cn(
                      "w-full h-full flex items-center justify-center text-xs font-bold text-white",
                      getAvatarColor(req.name || "Пользователь")
                    )}>
                      {getInitials(req.name || "Пользователь")}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{req.name || "Пользователь"}</p>
                  <p className="text-xs text-muted-foreground truncate">@{req.username}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-muted-foreground shrink-0"
                  disabled={processing[req.id]}
                  onClick={() => withGuard(req.id, () => cancelRequest(req.id))}
                >
                  {processing[req.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : "Отменить"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-border/50" />
    </div>
  );
}
