import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="bg-blueprint-deep py-11 text-paper/60">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-8">
        <div>
          <Logo variant="full" onDark />
          <span className="mt-1 block text-[0.85rem]">
            Hệ sinh thái quản trị doanh nghiệp số.
          </span>
        </div>
        <div className="font-mono text-[0.8rem]">
          © 2026 · DIGITAL ENTERPRISE MANAGEMENT ECOSYSTEM
        </div>
      </div>
    </footer>
  );
}
