"use client";
import { useState } from "react";
import { useLang } from "@/components/invite-sections/i18n";
import { InviteShell, CreateButton } from "@/components/invite-sections";
import { SacredGardenInvitation, SgEnvelope, gardenTheme } from "@/components/invite-sections/garden";
import { sacredGardenFor } from "@/lib/sacred-garden";

/** The Sacred Garden: an envelope film opens onto the invitation. */
export default function DemoGardenInvitation() {
  const [opened, setOpened] = useState(false);
  return <InviteShell locked={!opened} languages>
    <GardenContent onDone={() => setOpened(true)} />
    {opened && <CreateButton />}
  </InviteShell>;
}

function GardenContent({ onDone }) {
  const { lang } = useLang();
  const c = sacredGardenFor(lang);
  return <>
    <SgEnvelope video={c.envelope.video} music={c.music} tapLabel={c.envelope.tapLabel} monogram={c.monogram} sealTrack={c.envelope.sealTrack} sealImage={c.envelope.sealImage} theme={gardenTheme(c)} onDone={onDone} />
    <SacredGardenInvitation c={c} />
  </>;
}
