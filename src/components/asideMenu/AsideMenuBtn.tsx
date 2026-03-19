"use client";

import { usePathname, useRouter } from "next/navigation";
import { IconType } from "react-icons";

interface AsideMenuBtnProps {
  value: string;
  icon: IconType;
  fill: string;
  href: string;
}

export default function AsideMenuBtn({ value, icon: Icon, fill, href }: AsideMenuBtnProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <button
      className={`${
        pathname === href
          ? "text-darkOrange bg-lightBeige border-darkOrange"
          : "text-grey bg-white border-borderGrey"
      } w-[100%] flex items-center text-darkGrey font-normal rounded-xl border-[1px] p-2 mb-2`}
      onClick={() => router.push(href)}
    >
      <Icon fill={fill} className="mr-2" />
      {value}
    </button>
  );
}
