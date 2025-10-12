import { Heart } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-background mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <p className="text-center text-muted-foreground flex items-center justify-center gap-1 flex-wrap" style={{ fontSize: '9px' }}>
          <span>© {currentYear} Easyread IQ</span>
          <span className="hidden sm:inline">|</span>
          <span className="flex items-center gap-1">
            inspired with <Heart className="inline-block fill-red-500 text-red-500" style={{ width: '10px', height: '10px' }} /> by Easyread Series
          </span>
        </p>
      </div>
    </footer>
  );
}
