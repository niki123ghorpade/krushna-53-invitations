"use client";
import { useCallback, useMemo, useState } from "react";
import { InviteShell, VelvetCurtainIntro, CardInvitation, CreateButton, MusicToggle, useInviteMusic, DemoBar } from "@/components/invite-sections";
import { useLang } from "@/components/invite-sections/i18n";
import { demoInvitationFor } from "@/lib/demo-invitation-i18n";

/** Card-look demo: curtain to open, then the invitation as one linen page, in the chosen language. */
export default function DemoCardInvitation() {
  const [opened, setOpened] = useState(false);
  const createBuffer = useCallback(() => import("@/lib/music").then((m) => m.generateMusic("calm", 32)), []);
  const music = useInviteMusic({ createBuffer });

  return <InviteShell locked={!opened} languages>
    <DemoContent opened={opened} onOpened={() => setOpened(true)} music={music} />
  </InviteShell>;
}

/** Lives inside InviteShell so it can read the picked language and swap the whole sample. */
function DemoContent({ opened, onOpened, music }) {
  const { lang } = useLang();
  const d = useMemo(() => demoInvitationFor(lang), [lang]);
  return <>
    <VelvetCurtainIntro names={`${d.groom} & ${d.bride}`} onOpen={() => music.play()} onDone={onOpened} />
    {opened && <DemoBar />}
    <CardInvitation d={d} active={opened} classicLink />
    <CreateButton />
    {opened && <MusicToggle playing={music.playing} onToggle={music.toggle} />}
  </>;
}
