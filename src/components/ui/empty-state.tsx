import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { Button } from "./button";

interface EmptyStateProps {
  title: string;
  description?: string;
  image: StaticImageData | string;
  actionLabel?: string;
  actionHref?: string;
  imageAlt?: string;
}

export default function EmptyState({
  title,
  description,
  image,
  imageAlt = "Empty state illustration",
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center mt-10pb-10 text-center text-muted-foreground">
      <div className="mb-6 relative w-80 h-80">
        <Image src={image} alt={imageAlt} fill className="object-contain" />
      </div>
      <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
      {description && (
        <p className="mt-2 text-lg w-2/3 mx-auto">{description}</p>
      )}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="mt-4">
          <Button>{actionLabel}</Button>
        </Link>
      )}
    </div>
  );
}
