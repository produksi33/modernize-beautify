import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AnomaliSection } from "@/components/sections/AnomaliSection";
import { GrafikSection } from "@/components/sections/GrafikSection";
import { PetaSection } from "@/components/sections/PetaSection";
import { HasilUbinanSection } from "@/components/sections/HasilUbinanSection";
import { GrafikUbinanSection } from "@/components/sections/GrafikUbinanSection";
import { DatabasePetaniSection } from "@/components/sections/DatabasePetaniSection";
import { PetunjukTeknisSection } from "@/components/sections/PetunjukTeknisSection";

const Index = () => {
  const [activeSection, setActiveSection] = useState("anomali");

  const renderSection = () => {
    switch (activeSection) {
      case "anomali": return <AnomaliSection />;
      case "grafik": return <GrafikSection />;
      case "peta": return <PetaSection />;
      case "hasil-ubinan": return <HasilUbinanSection />;
      case "grafik-ubinan": return <GrafikUbinanSection />;
      case "database-petani": return <DatabasePetaniSection />;
      case "petunjuk-teknis": return <PetunjukTeknisSection />;
      default: return <AnomaliSection />;
    }
  };

  return (
    <DashboardLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      {renderSection()}
    </DashboardLayout>
  );
};

export default Index;
