import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function OnboardingGate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Check synchronously via initializer to avoid white-screen flash
  const [ready, setReady] = useState(() => {
    const onboarded = localStorage.getItem("qaryz-onboarded");
    if (!onboarded && location.pathname !== "/onboarding") {
      return false;
    }
    return true;
  });

  useEffect(() => {
    const onboarded = localStorage.getItem("qaryz-onboarded");

    if (!onboarded && location.pathname !== "/onboarding") {
      navigate("/onboarding", { replace: true });
    } else {
      setReady(true);
    }
  }, [navigate, location.pathname]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
