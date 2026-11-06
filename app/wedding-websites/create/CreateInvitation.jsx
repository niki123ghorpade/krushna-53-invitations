"use client";
import { useMemo, useState } from "react";
import { InviteShell } from "@/components/invite-sections";
import { SacredGardenInvitation, SgEnvelope } from "@/components/invite-sections/garden";
import { FORM_GROUPS, formDefaults, buildInvitation } from "@/lib/invitation-form";
import { readImage } from "@/lib/image-upload";
import s from "./create.module.css";

/** One picture: upload from the device, or paste a URL. Empty = the design's own picture. */
function ImageField({ value, onChange }) {
  const [error, setError] = useState("");
  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try { onChange(await readImage(file)); setError(""); } catch (err) { setError(err.message); }
  };
  const uploaded = value.startsWith("data:");
  return <div className={s.imageField}>
    {value ? <img className={s.thumb} src={value} alt="" /> : <p className={s.hint}>Showing the design&apos;s picture.</p>}
    <div className={s.row}>
      <label className={s.fileBtn}>{value ? "Change photo" : "Upload photo"}<input type="file" accept="image/*" hidden onChange={pick} /></label>
      {value && <button type="button" className={s.linkBtn} onClick={() => onChange("")}>Remove</button>}
    </div>
    {!uploaded && <input className={s.input} placeholder="…or paste an image link" value={value} onChange={(e) => onChange(e.target.value)} />}
    {error && <p className={s.error}>{error}</p>}
  </div>;
}

/** Left: the form. Right: the Sacred Garden invitation, updated as you type or upload. */
export default function CreateInvitation() {
  const [form, setForm] = useState(formDefaults);
  const [envelope, setEnvelope] = useState(false);
  const c = useMemo(() => buildInvitation(form), [form]);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  return <InviteShell className={s.page}>
    <aside className={s.formPane}>
      <header className={s.head}>
        <h1>Create your invitation</h1>
        <p>Type or upload on the left, and your invitation updates on the right.</p>
        <button type="button" className={s.reset} onClick={() => setForm(formDefaults)}>Reset to sample</button>
        <button type="button" className={s.envelopeBtn} onClick={() => setEnvelope(true)}>Preview the envelope</button>
      </header>
      <form onSubmit={(e) => e.preventDefault()}>
        {FORM_GROUPS.map((group) => <fieldset key={group.title} className={s.group}>
          <legend>{group.title}</legend>
          {group.hint && <p className={s.hint}>{group.hint}</p>}
          {group.fields.map(([key, label, type = "text"]) => type === "image"
            ? <div key={key} className={s.label}><span>{label}</span><ImageField value={form[key]} onChange={set(key)} /></div>
            : <label key={key} className={s.label}>
              <span>{label}</span>
              {type === "textarea"
                ? <textarea className={s.input} rows={4} value={form[key]} onChange={(e) => set(key)(e.target.value)} />
                : <input className={s.input} type={type} value={form[key]} onChange={(e) => set(key)(e.target.value)} />}
            </label>)}
        </fieldset>)}
      </form>
    </aside>
    <main className={s.previewPane}>
      <div className={s.previewGarden}><SacredGardenInvitation c={c} /></div>
    </main>
    {envelope && <SgEnvelope video={c.envelope.video} monogram={c.monogram} sealTrack={c.envelope.sealTrack} tapLabel={c.envelope.tapLabel} onDone={() => setEnvelope(false)} />}
  </InviteShell>;
}
