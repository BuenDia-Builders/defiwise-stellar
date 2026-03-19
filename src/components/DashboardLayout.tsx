import { ReactNode } from "react";
import AsideMenu from "@/components/asideMenu/AsideMenu";
import Progress from "@/app/dashboard/progress/Progress";
import { Compite } from "@/app/dashboard/progress/Compite";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap lg:justify-center gap-8 max-w-[1536px] m-auto">
      <AsideMenu />
      <div className="max-w-[750px] md:p-6">{children}</div>
      <aside className="lg:max-w-[380px]">
        <Progress />
        <Compite />
      </aside>
    </div>
  );
}
