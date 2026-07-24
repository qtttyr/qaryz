export default function LegalFooter() {
  return (
    <footer className="mt-auto pt-8 pb-4 px-4 text-center">
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground/50">
        <a
          href="/privacy-policy.html"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-muted-foreground/80 transition-colors"
        >
          Политика конфиденциальности
        </a>
        <span className="text-muted-foreground/20">·</span>
        <a
          href="/terms-of-service.html"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-muted-foreground/80 transition-colors"
        >
          Пользовательское соглашение
        </a>
        <span className="text-muted-foreground/20">·</span>
        <span>© 2026 Qaryz</span>
      </div>
    </footer>
  );
}
