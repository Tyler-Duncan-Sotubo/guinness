import Image from "next/image";
import Link from "next/link";

type ApplicationLogoProps = {
  className?: string;
  src: string;
  alt: string;
  link?: string;
  close?: () => void;
};

const ApplicationLogo: React.FC<ApplicationLogoProps> = ({
  className,
  src,
  alt,
  link = "/",
  close = () => {},
}) => (
  <Link href={link} passHref onClick={() => close()}>
    <div className={`relative ${className || ""}`}>
      <Image src={src} alt={alt} fill style={{ objectFit: "contain" }} />
    </div>
  </Link>
);

export default ApplicationLogo;
