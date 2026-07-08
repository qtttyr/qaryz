import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useGroupStore } from "@/stores/groupStore";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function JoinPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get("code");
  const user = useAuthStore((s) => s.user);
  const joinByInvite = useGroupStore((s) => s.joinByInvite);

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!code) {
      setStatus("error");
      setMessage("Не указан код приглашения");
      return;
    }

    if (!user) {
      setStatus("error");
      setMessage("Необходимо авторизоваться, чтобы присоединиться к группе");
      return;
    }

    const doJoin = async () => {
      try {
        const result = await joinByInvite(code);
        if (result.error) {
          setStatus("error");
          setMessage(result.error);
        } else {
          setStatus("success");
          setMessage("Вы успешно присоединились к группе!");
        }
      } catch (e) {
        setStatus("error");
        setMessage("Произошла ошибка при подключении к группе");
        console.error(e);
      }
    };
    doJoin();
  }, [code, user, joinByInvite]);

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh p-6 text-center">
      {status === "loading" && (
        <>
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <h1 className="text-xl font-semibold mb-1">Присоединение к группе</h1>
          <p className="text-sm text-muted-foreground">Пожалуйста, подождите...</p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-xl font-semibold mb-1">Готово!</h1>
          <p className="text-sm text-muted-foreground mb-6">{message}</p>
          <Button onClick={() => navigate("/groups")}>
            <Users className="w-4 h-4 mr-2" /> Перейти к группам
          </Button>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-xl font-semibold mb-1">Ошибка</h1>
          <p className="text-sm text-muted-foreground mb-6">{message}</p>
          {!user && (
            <Button onClick={() => navigate("/auth")} className="mb-2">
              Войти в аккаунт
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate("/groups")}>
            К группам
          </Button>
        </>
      )}
    </div>
  );
}
