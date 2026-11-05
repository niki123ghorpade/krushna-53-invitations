"use client";
import { useCallback, useState } from "react";
import { InviteShell, VelvetCurtainIntro, CardInvitation, CreateButton, MusicToggle, useInviteMusic, DemoBar } from "@/components/invite-sections";
import { demoInvitation } from "@/lib/demo-invitation";

/** Card-look demo: curtain to open, then the invitation as one linen page, in the chosen language. */
export default function DemoCardInvitation() {
  const [opened, setOpened] = useState(false);
  const createBuffer = useCallback(() => import("@/lib/music").then((m) => m.generateMusic("calm", 32)), []);
  const music = useInviteMusic({ createBuffer });

  return <InviteShell locked={!opened} languages>
    <DemoContent opened={opened} onOpened={() => setOpened(true)} music={music} />
  </InviteShell>;
}

/** The selected language is applied to the rendered invitation through Google Translation. */
function DemoContent({ opened, onOpened, music }) {
  const d = demoInvitation;
  return <>
    <VelvetCurtainIntro names={`${d.groom} & ${d.bride}`} onOpen={() => music.play()} onDone={onOpened} />
    {opened && <DemoBar />}
    <CardInvitation d={d} active={opened} classicLink />
    <CreateButton />
    {opened && <MusicToggle playing={music.playing} onToggle={music.toggle} />}
  </>;
}
