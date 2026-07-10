import { Outlet, useLocation } from "react-router-dom";
import { Suspense } from "react";
import BottomNav from "./BottomNav";
import FloatingAddButton from "./FloatingAddButton";
import { useIsMobile } from "@/hooks/use-mobile";
import { AnimatePresence, motion } from "framer-motion";
import DebtForm from "@/components/debts/DebtForm";
import PaymentForm from "@/components/debts/PaymentForm";
import PageLoader from "@/components/shared/PageLoader";
import { useUIStore } from "@/stores/uiStore";

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export default function AppLayout() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const activeModal = useUIStore((s) => s.activeModal);
  const activeModalData = useUIStore((s) => s.activeModalData);
  const closeModal = useUIStore((s) => s.closeModal);

  const isPersonDetail = location.pathname.startsWith("/person/");
  const isGroupPage = location.pathname.startsWith("/groups");
  const isFriendPage = location.pathname.startsWith("/friends");

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Main content area */}
      <main
        className={`flex-1 w-full max-w-2xl mx-auto ${
          isMobile ? "pb-24 px-4 pt-4" : "pb-8 px-6 pt-6"
        }`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom navigation (mobile) */}
      {isMobile && <BottomNav />}

      {/* Desktop navigation — top bar style */}
      {!isMobile && !isPersonDetail && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="max-w-2xl mx-auto">
            <BottomNav variant="top" />
          </div>
        </div>
      )}

      {/* Desktop top padding when top bar present */}
      {!isMobile && !isPersonDetail && <div className="h-16" />}

      {/* Floating add button — hide on detail pages */}
      {!isPersonDetail && !isGroupPage && !isFriendPage && <FloatingAddButton />}

      {/* DebtForm Modal/Sheet */}
      <DebtForm
        open={activeModal === "add-debt"}
        onClose={closeModal}
        defaultPersonId={activeModalData?.personId as string | undefined}
      />

      {/* PaymentForm Modal/Sheet */}
      <PaymentForm
        open={activeModal === "add-payment"}
        onClose={closeModal}
        debtId={activeModalData?.debtId as string | undefined}
      />
    </div>
  );
}
