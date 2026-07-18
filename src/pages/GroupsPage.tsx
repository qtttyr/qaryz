import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGroups } from "@/hooks/useGroups";
import { GroupCard } from "@/components/groups/GroupCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/stores/authStore";
import { useGroupStore } from "@/stores/groupStore";
import { ArrowLeft, Plus, Users, Search, LogIn } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import PullToRefresh from "@/components/layout/PullToRefresh";

export default function GroupsPage() {
  const groups = useGroups();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isMobile = useIsMobile();
  const syncFromSupabase = useGroupStore((s) => s.syncFromSupabase);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"recent" | "name" | "amount">("recent");

  const filtered = groups
    .filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "amount") return b.total - a.total;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Users className="w-16 h-16 text-muted-foreground/40 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Групповые расходы</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Войдите в аккаунт, чтобы создавать группы и делиться расходами с друзьями
        </p>
        <Button onClick={() => navigate("/auth")}>
          <LogIn className="w-4 h-4 mr-2" /> Войти
        </Button>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={syncFromSupabase}>
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          {isMobile && (
            <button onClick={() => navigate("/friends")} className="p-1 -ml-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-xl font-bold flex-1">Группы</h1>
          <Button size="sm" onClick={() => navigate("/groups/create")}>
            <Plus className="w-4 h-4 mr-1" /> Создать
          </Button>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Поиск групп..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectTrigger className="w-28 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Новые</SelectItem>
              <SelectItem value="name">По имени</SelectItem>
              <SelectItem value="amount">По сумме</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-muted-foreground/60" />
            </div>
            <p className="text-muted-foreground">
              {search ? "Группы не найдены" : "У вас пока нет групп"}
            </p>
            {!search && (
              <Button variant="link" onClick={() => navigate("/groups/create")} className="mt-1">
                Создать первую группу
              </Button>
            )}
          </div>
        ) : (
          filtered.map((g) => (
            <GroupCard
              key={g.id}
              id={g.id}
              name={g.name}
              emoji={g.emoji}
              photo={g.photo}
              memberCount={g.memberCount}
              total={g.total}
              onClick={() => navigate(`/groups/${g.id}`)}
            />
          ))
        )}
      </div>
    </div>
    </PullToRefresh>
  );
}
