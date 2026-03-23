import Image from "next/image";

export function ItemThumb({
  src,
  alt,
  size = 64
}: {
  src: string | null;
  alt: string;
  size?: number;
}) {
  return (
    <div className="item-thumb" style={{ width: size, height: size }}>
      {src ? (
        <Image alt={alt} fill sizes={`${size}px`} src={src} />
      ) : (
        <span>{alt.slice(0, 2).toUpperCase()}</span>
      )}
    </div>
  );
}
