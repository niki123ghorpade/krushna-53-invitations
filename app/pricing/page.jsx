import PricingCustomise from "@/components/PricingCustomise";
import { SiteHeader, SiteFooter } from "@/components/ui";
export default function PricingPage() {
    return <main className="studio"><SiteHeader active="/pricing" />
      <section className="landing-pricing landing-custom-only"><PricingCustomise /></section>
      <SiteFooter /></main>;
}
