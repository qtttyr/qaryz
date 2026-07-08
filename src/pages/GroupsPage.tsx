import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGroups } from "@/hooks/useGroups";
import { GroupCard } from "@/components/groups/GroupCard";
import { InviteSheet } from "@/components/groups/InviteSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/stores/authStore";
import { useGroupStore } from "@/stores/groupStore";
import { Plus, Users, Search, Loader2, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export default function GroupsPage() {
  const groups = useGroups();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const syncStatus = useGroupStore((s) => s.syncStatus);
  const createGroup = useGroupStore((s) => s.createGroup);
  const isMobile = useIsMobile();

  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"recent" | "name" | "amount">("recent");
  const [createName, setCreateName] = useState("");
  const [createEmoji, setCreateEmoji] = useState("👥");
  const [creating, setCreating] = useState(false);

  const filtered = groups
    .filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "amount") return b.total - a.total;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const handleCreate = async () => {
    if (!createName.trim()) return;
    setCreating(true);
    try {
      await createGroup(createName.trim(), createEmoji);
      setShowCreate(false);
      setCreateName("");
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Users className="w-16 h-16 text-muted-foreground/40 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Групповые расходы</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Войдите в аккаунт, чтобы создавать группы и делиться расходами с друзьями
        </p>
        <Button onClick={() => navigate("/login")}>
          <LogIn className="w-4 h-4 mr-2" /> Войти
        </Button>
      </div>
    );
  }

  const Container = isMobile ? Sheet : Dialog;
  const ContainerContent = isMobile ? SheetContent : DialogContent;
  const ContainerHeader = isMobile ? SheetHeader : DialogHeader;
  const ContainerTitle = isMobile ? SheetTitle : DialogTitle;
  const ContainerTrigger = isMobile ? SheetTrigger : DialogTrigger;

  // For invite sheet, we need the currently selected group
  const [inviteGroup, setInviteGroup] = useState<{ id: string; name: string; inviteCode: string } | null>(null);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">Группы</h1>
          <Button size="sm" onClick={() => setShowCreate(true)}>
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
        {syncStatus === "syncing" && groups.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-muted-foreground/60" />
            </div>
            <p className="text-muted-foreground">
              {search ? "Группы не найдены" : "У вас пока нет групп"}
            </p>
            {!search && (
              <Button variant="link" onClick={() => setShowCreate(true)} className="mt-1">
                Создать первую группу
              </Button>
            )}
          </div>
        ) : (
          filtered.map((g) => (
            <GroupCard
              key={g.id}
              {...g}
              balance={0}
              onClick={() => navigate(`/groups/${g.id}`)}
            />
          ))
        )}
      </div>

      {/* Create Group Dialog */}
      {showCreate && (
        <Container open={showCreate} onOpenChange={setShowCreate}>
          <ContainerContent className={cn(isMobile ? "" : "sm:max-w-sm")}>
            <ContainerHeader>
              <ContainerTitle>Новая группа</ContainerTitle>
            </ContainerHeader>
            <div className="space-y-4 mt-2">
              <div className="flex gap-3">
                <Input
                  placeholder="👥"
                  value={createEmoji}
                  onChange={(e) => setCreateEmoji(e.target.value)}
                  className="w-16 text-center text-xl"
                  maxLength={2}
                />
                <Input
                  placeholder="Название группы"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="flex-1"
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={!createName.trim() || creating}
                className="w-full"
              >
                {creating ? "Создание..." : "Создать группу"}
              </Button>
            </div>
          </ContainerContent>
        </Container>
      )}
    </div>
  );
}
