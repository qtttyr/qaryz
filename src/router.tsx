import { createBrowserRouter } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import OwedToMePage from "@/pages/OwedToMePage";
import IOwePage from "@/pages/IOwePage";
import PersonDetailPage from "@/pages/PersonDetailPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import ProfilePage from "@/pages/ProfilePage";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <OwedToMePage /> },
      { path: "i-owe", element: <IOwePage /> },
      { path: "person/:id", element: <PersonDetailPage /> },
      { path: "analytics", element: <AnalyticsPage /> },
      { path: "profile", element: <ProfilePage /> },
    ],
  },
]);
