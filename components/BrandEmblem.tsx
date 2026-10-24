import Image from "next/image";

export function BrandEmblem({ size = 40, className = "", priority = false }: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return <span
    className={`brand-emblem${className ? ` ${className}` : ""}`}
    style={{ "--brand-emblem-size": `${size}px` } as React.CSSProperties}
    aria-hidden="true"
  >
    <Image src="/Logo.webp" alt="" width={128} height={128} priority={priority} />
  </span>;
}
