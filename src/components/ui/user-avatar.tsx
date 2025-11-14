import Image from "next/image";
import { CgProfile } from "react-icons/cg";

export default function UserAvatar({
  avatar,
  name,
}: {
  avatar?: string | null | undefined;
  name?: string;
}) {
  return (
    <>
      {avatar ? (
        <div className="relative h-10 w-10">
          <Image
            src={avatar}
            alt={name || "User avatar"}
            fill
            className="rounded-full object-contain border-2 border-gray-600"
            unoptimized
          />
        </div>
      ) : (
        <CgProfile size={30} />
      )}
    </>
  );
}
