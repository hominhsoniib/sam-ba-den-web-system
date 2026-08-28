import Image from "next/image";

type LogoProps = {
  /** "mark" = icon only, "full" = icon + wordmark + sub-label */
  variant?: "mark" | "full";
  /** use the light-stroke version for dark/blueprint backgrounds */
  onDark?: boolean;
  className?: string;
};

const SRC = {
  mark: { light: "/nexus-mark.svg", dark: "/nexus-mark-dark.svg" },
  full: { light: "/nexus-logo-full.svg", dark: "/nexus-logo-full-dark.svg" },
};

const SIZE = {
  mark: { width: 32, height: 32 },
  full: { width: 220, height: 44 },
};

export function Logo({ variant = "full", onDark = false, className }: LogoProps) {
  const src = SRC[variant][onDark ? "dark" : "light"];
  const { width, height } = SIZE[variant];
  return (
    <Image
      src={src}
      alt="NEXUS Enterprise OS"
      width={width}
      height={height}
      className={className}
      priority
    />
  );
}
