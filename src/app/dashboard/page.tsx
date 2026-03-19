import { Module1, Module2 } from "./ruta_aprendizaje/components/Module";
import { ModuleCallToAction } from "./ruta_aprendizaje/components/ModuleCallToAction";
import DashboardLayout from "@/components/DashboardLayout";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <section>
        <h2 className="text-active text-[23px] mb-6">Introducción a DeFi</h2>
        <Module1 />
        <Module2 />
        <ModuleCallToAction />
      </section>
    </DashboardLayout>
  );
}
