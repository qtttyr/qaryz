import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import OnboardingGate from "@/components/layout/OnboardingGate";
import AppLayout from "@/components/layout/AppLayout";
import AuthPage from "@/pages/AuthPage";
import OnboardingPage from "@/pages/OnboardingPage";
import OwedToMePage from "@/pages/OwedToMePage";
import IOwePage from "@/pages/IOwePage";
import PersonDetailPage from "@/pages/PersonDetailPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import ProfilePage from "@/pages/ProfilePage";

export const router = createBrowserRouter([
  {
    path: "/auth",
    element: (
      <ProtectedRoute>
        <AuthPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/onboarding",
    element: <OnboardingPage />,
  },
  {
    element: (
      <ProtectedRoute>
        <OnboardingGate>
          <AppLayout />
        </OnboardingGate>
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <OwedToMePage /> },
      { path: "i-owe", element: <IOwePage /> },
      { path: "person/:id", element: <PersonDetailPage /> },
      { path: "analytics", element: <AnalyticsPage /> },
      { path: "profile", element: <ProfilePage /> },
    ],
  },
]);
