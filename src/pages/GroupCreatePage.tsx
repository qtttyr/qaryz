import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGroupStore } from "@/stores/groupStore";
import { useAuthStore } from "@/stores/authStore";
import { useFriendStore } from "@/stores/friendStore";
import { PhotoUpload } from "@/components/groups/PhotoUpload";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, Check, Users, X } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function GroupCreatePage() {
  const navigate = useNavigate();
  const createGroup = useGroupStore((s) => s.createGroup);
  const user = useAuthStore((s) => s.user);
  const friends = useFriendStore((s) => s.friends);

  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  const [selected, setSelected] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [creating, setCreating] = useState(false);

  // Get friend profiles
  const friendProfiles = useMemo(() => {
    if (!user) return [];
    return friends
      .map((f) => {
        const otherId = f.userId === user.id ? f.friendId : f.userId;
        return {
          id: otherId,
          name: f.name || "Пользователь",
          username: f.username || "",
          avatar: f.avatar,
        };
      })
      .filter((f) =>
        !searchQuery.trim() ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [friends, user, searchQuery]);

  const toggleMember = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (creating || !name.trim()) return;
    setCreating(true);
    try {
      const groupId = await createGroup(name.trim(), "👥", undefined, photo, selected);
      navigate(`/groups/${groupId}`);
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center px-4 h-12 gap-2">
          <button onClick={() => navigate("/groups")} className="p-1 -ml-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold">Новая группа</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 pt-6 pb-4 max-w-sm mx-auto space-y-6">
          {/* Photo */}
          <div className="flex justify-center">
            <PhotoUpload
              value={photo}
              onChange={setPhoto}
              name={name || "Группа"}
              size="lg"
            />
          </div>

          {/* Name */}
          <div className="space-y-1">
            <input
              placeholder="Название группы"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-center text-xl font-semibold bg-transparent border-0 border-b-2 border-border/30 pb-2 outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/30"
              autoFocus
              maxLength={50}
            />
          </div>
        </div>

        {/* Members section */}
        <div className="border-t border-border/20">
          <div className="px-6 pt-5 pb-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                Участники
                {selected.length > 0 && (
                  <span className="ml-1.5 text-primary font-semibold">
                    · {selected.length}
                  </span>
                )}
              </h2>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <input
                placeholder="Поиск друзей..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-3 text-sm rounded-xl bg-muted/50 border border-border/30 outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-muted-foreground/40" />
                </button>
              )}
            </div>
          </div>

          {/* Friend list */}
          <div className="px-6 pb-6">
            {friendProfiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="w-10 h-10 text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground/60">
                  {searchQuery
                    ? "Ничего не найдено"
                    : "У вас пока нет друзей в Qaryz"}
                </p>
                <p className="text-xs text-muted-foreground/40 mt-1">
                  {!searchQuery && "Добавьте друзей в профиле"}
                </p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {friendProfiles.map((friend, i) => {
                  const isSelected = selected.includes(friend.id);
                  return (
                    <motion.button
                      key={friend.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.02 }}
                      onClick={() => toggleMember(friend.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left",
                        isSelected
                          ? "bg-primary/8 ring-1 ring-primary/25"
                          : "hover:bg-muted/40"
                      )}
                      type="button"
                    >
                      {/* Avatar */}
                      {friend.avatar ? (
                        <img
                          src={friend.avatar}
                          alt={friend.name}
                          className="w-9 h-9 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div
                          className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0",
                            isSelected ? "bg-primary" : "bg-muted-foreground/25"
                          )}
                        >
                          {friend.name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium truncate">
                          {friend.name}
                        </p>
                        {friend.username && (
                          <p className="text-[11px] text-muted-foreground/50 truncate">
                            @{friend.username}
                          </p>
                        )}
                      </div>

                      {/* Checkbox */}
                      <div
                        className={cn(
                          "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-200",
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/25"
                        )}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom — Create button */}
      <div className="px-4 py-3 border-t bg-background/80 backdrop-blur-sm">
        <Button
          onClick={handleCreate}
          disabled={!name.trim() || creating}
          className="w-full h-12 rounded-2xl text-base font-semibold"
        >
          {creating
            ? "Создание..."
            : `Создать группу${selected.length > 0 ? ` (${selected.length})` : ""}`}
        </Button>
      </div>
    </div>
  );
}
