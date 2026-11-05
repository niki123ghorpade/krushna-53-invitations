"use client";
import { useCallback, useState } from "react";
import {
  InviteShell, IntroCover, HeroSection, WelcomeSection, SaveTheDateSection, CountdownSection,
  EventsSection, ProgramTimelineSection, VenueSection, GallerySection, MenuSection, DressCodeSection,
  GuestInfoSection, RsvpSection, ClosingSection, MusicToggle, useInviteMusic, DemoBar, CreateButton,
} from "@/components/invite-sections";
import { demoInvitation } from "@/lib/demo-invitation";

export default function DemoInvitation() {
  const [opened, setOpened] = useState(false);
  // Built-in santoor-style tune, generated in the browser (no audio file needed).
  const createBuffer = useCallback(() => import("@/lib/music").then((m) => m.generateMusic("calm", 32)), []);
  const music = useInviteMusic({ createBuffer });
  return <InviteShell locked={!opened} languages>
    <DemoContent d={demoInvitation} opened={opened} music={music} onOpen={() => { setOpened(true); music.play(); }} />
  </InviteShell>;
}

function DemoContent({ d, opened, music, onOpen }) {
  const couple = `${d.groom} & ${d.bride}`;
  return <>
    <IntroCover monogram={d.monogram} guestLine="You're invited" kicker={`THE WEDDING OF ${d.groom.toUpperCase()} & ${d.bride.toUpperCase()}`} onOpen={onOpen} />
    {opened && <DemoBar />}

    <HeroSection groom={d.groom} bride={d.bride} blessing={d.blessing} message={d.message} dateLabel={d.dateLabel} place={d.place} image={d.heroImage} imageAlt={`${couple} at sunset`} active={opened} nextId="welcome" />
    <WelcomeSection message={d.welcome.message} families={d.welcome.families} />
    <SaveTheDateSection date={d.date} endDate={d.endDate} eventTitle={`${couple} — Wedding`} location={`${d.venue.name}, ${d.venue.address}`} details={`Join us to celebrate the wedding of ${couple}.`} subtitle="Scratch the card to reveal our big day" />
    <CountdownSection date={d.date} image={d.venue.image} />
    <EventsSection events={d.events} subtitle="Five days of colour, music and love" />
    <ProgramTimelineSection items={d.program} subtitle="Sunday, 14 February 2027" />
    <VenueSection {...d.venue} />
    <GallerySection photos={d.gallery} />
    <MenuSection veg={d.menu.veg} />
    <DressCodeSection {...d.dressCode} />
    <GuestInfoSection items={d.guestInfo} />
    <RsvpSection events={d.rsvp.events} deadline={d.rsvp.deadline} coupleNames={couple} subtitle="We'd love to know if you can make it" />
    <ClosingSection message={d.closing.message} names={couple.toUpperCase()} hashtag={d.closing.hashtag} image={d.closing.image} contacts={d.closing.contacts}
      brand={{ name: "EveryMoment", logo: "/everymoment-icon.svg", href: "/", ctaLabel: "Get a website like this", ctaHref: "/wedding-websites" }} />

    <CreateButton />
    {opened && <MusicToggle playing={music.playing} onToggle={music.toggle} />}
  </>;
}
