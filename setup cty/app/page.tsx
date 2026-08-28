import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { EcosystemGrid } from "@/components/EcosystemGrid";
import { DiagramShowcaseSection } from "@/components/DiagramShowcaseSection";
import { OperatingLoop } from "@/components/OperatingLoop";
import { DataCases } from "@/components/DataCases";
import { RolesLadder } from "@/components/RolesLadder";
import { Benefits } from "@/components/Benefits";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <EcosystemGrid />
        <DiagramShowcaseSection />
        <OperatingLoop />
        <DataCases />
        <RolesLadder />
        <Benefits />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
