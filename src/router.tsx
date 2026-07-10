import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import OnboardingGate from "@/components/layout/OnboardingGate";
import AppLayout from "@/components/layout/AppLayout";
import PageLoader from "@/components/shared/PageLoader";

const LandingPage = lazy(() => import("@/pages/LandingPage"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const OnboardingPage = lazy(() => import("@/pages/OnboardingPage"));
const OwedToMePage = lazy(() => import("@/pages/OwedToMePage"));
const IOwePage = lazy(() => import("@/pages/IOwePage"));
const PersonDetailPage = lazy(() => import("@/pages/PersonDetailPage"));
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const GroupsPage = lazy(() => import("@/pages/GroupsPage"));
const GroupDetailPage = lazy(() => import("@/pages/GroupDetailPage"));
const JoinPage = lazy(() => import("@/pages/JoinPage"));
const AddFriendPage = lazy(() => import("@/pages/AddFriendPage"));
const FriendsPage = lazy(() => import("@/pages/FriendsPage"));
const FriendProfilePage = lazy(() => import("@/pages/FriendProfilePage"));

export const router = createBrowserRouter([
  {
    path: "/welcome",
    element: (
      <Suspense fallback={<PageLoader />}>
        <LandingPage />
      </Suspense>
    ),
  },
  {
    path: "/auth",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <AuthPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/onboarding",
    element: (
      <Suspense fallback={<PageLoader />}>
        <OnboardingPage />
      </Suspense>
    ),
  },
  {
    path: "/join",
    element: (
      <Suspense fallback={<PageLoader />}>
        <JoinPage />
      </Suspense>
    ),
  },
  {
    path: "/add-friend",
    element: (
      <Suspense fallback={<PageLoader />}>
        <AddFriendPage />
      </Suspense>
    ),
  },
  {
    path: "/add-friend/:userId",
    element: (
      <Suspense fallback={<PageLoader />}>
        <AddFriendPage />
      </Suspense>
    ),
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
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <OwedToMePage />
          </Suspense>
        ),
      },
      {
        path: "i-owe",
        element: (
          <Suspense fallback={<PageLoader />}>
            <IOwePage />
          </Suspense>
        ),
      },
      {
        path: "person/:id",
        element: (
          <Suspense fallback={<PageLoader />}>
            <PersonDetailPage />
          </Suspense>
        ),
      },
      {
        path: "friends",
        element: (
          <Suspense fallback={<PageLoader />}>
            <FriendsPage />
          </Suspense>
        ),
      },
      {
        path: "friends/:id",
        element: (
          <Suspense fallback={<PageLoader />}>
            <FriendProfilePage />
          </Suspense>
        ),
      },
      {
        path: "groups",
        element: (
          <Suspense fallback={<PageLoader />}>
            <GroupsPage />
          </Suspense>
        ),
      },
      {
        path: "groups/:id",
        element: (
          <Suspense fallback={<PageLoader />}>
            <GroupDetailPage />
          </Suspense>
        ),
      },
      {
        path: "analytics",
        element: (
          <Suspense fallback={<PageLoader />}>
            <AnalyticsPage />
          </Suspense>
        ),
      },
      {
        path: "profile",
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProfilePage />
          </Suspense>
        ),
      },
    ],
  },
]);
