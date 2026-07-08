import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function OnboardingGate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const onboarded = localStorage.getItem("qaryz-onboarded");

    if (!onboarded && location.pathname !== "/onboarding") {
      navigate("/onboarding", { replace: true });
    } else {
      setReady(true);
    }
  }, [navigate, location.pathname]);

  if (!ready) return null;

  return <>{children}</>;
}
