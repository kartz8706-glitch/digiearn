import Image from "next/image";

export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Image
      src="/digiearn-logo.svg"
      alt="digi.earn"
      width={compact ? 144 : 192}
      height={compact ? 60 : 192}
      className={compact ? "h-12 w-36 object-contain object-left" : "h-40 w-40 object-contain"}
      priority
    />
  );
}
