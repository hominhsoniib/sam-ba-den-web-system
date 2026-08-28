"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "./Logo";

const NAV = [
  { href: "#he-sinh-thai", label: "Hệ sinh thái" },
  { href: "#thu-vien-so-do", label: "Sơ đồ thuyết minh" },
  { href: "#van-hanh", label: "Vận hành" },
  { href: "#du-lieu", label: "Dữ liệu & AI" },
  { href: "#gia-tri", label: "Giá trị" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-[74px] max-w-[1200px] items-center justify-between px-8">
        <Link href="#top">
          <Logo variant="full" />
        </Link>

        <nav className="hidden gap-8 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="group relative py-1.5 text-sm font-semibold text-ink-soft transition-colors hover:text-blueprint"
            >
              {item.label}
              <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-amber transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        <a
          href="#lien-he"
          className="hidden rounded-sm bg-blueprint px-6 py-3 text-sm font-bold text-paper transition-all hover:-translate-y-0.5 hover:bg-blueprint-deep hover:shadow-panel md:inline-flex"
        >
          Đăng ký tư vấn
        </a>

        <button
          aria-label="Menu"
          className="p-2 md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="my-1.5 block h-0.5 w-6 bg-ink" />
          <span className="my-1.5 block h-0.5 w-6 bg-ink" />
          <span className="my-1.5 block h-0.5 w-6 bg-ink" />
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-4 border-b border-line bg-paper px-8 py-6 md:hidden">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="text-sm font-semibold text-ink-soft"
            >
              {item.label}
            </a>
          ))}
          <a
            href="#lien-he"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-sm bg-blueprint px-6 py-3 text-center text-sm font-bold text-paper"
          >
            Đăng ký tư vấn
          </a>
        </nav>
      )}
    </header>
  );
}
