"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { SiteFooter, SiteHeader, readSavedDetails } from "@/components/ui";
import HomeWeddingWebsitePromo from "@/components/HomeWeddingWebsitePromo";
import { DEMO_DETAILS } from "@/lib/invite-design";
const HomeFinder = dynamic(() => import("@/components/HomeFinder"), {
    ssr: false,
    loading: () => <section className="finder finder-loading" aria-label="Loading invitation designs"><div className="finder-inner"><h2>Find your <em>perfect design</em></h2><div className="finder-loading-card"/></div></section>,
});
export default function Home() {
    const [details, setDetails] = useState(DEMO_DETAILS);
    useEffect(() => { const d = readSavedDetails(); if (d?.brideName)
        setDetails(d); }, []);
    return (<main className="studio">
      <SiteHeader active="/"/>
      <section className="hero home-hero">
        <h1>Every ceremony, <em>beautifully invited.</em></h1>
        <p className="hero-question">How would you like to invite your guests?</p>
        <p className="hero-tagline"><span>Video reels · Cards</span><span>Wedding &amp; event invitations</span></p>
      </section>

      <HomeFinder details={details}/>

      <HomeWeddingWebsitePromo />

      <SiteFooter />
    </main>);
}
