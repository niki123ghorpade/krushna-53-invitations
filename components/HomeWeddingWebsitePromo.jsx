import { WhatsAppLink } from "@/components/ui";

const steps = [
  ["Share requirements", "Tell us your ideas, style and what you need."],
  ["Review the proposal", "We’ll share the proposal for you to review."],
  ["Approve the design", "Review the look and approve the design."],
  ["Provide details", "Share your wedding details, photos and special requests."],
  ["Make the website live", "We set it up and launch your wedding website."],
];
const stepIcons = ["☏", "▤", "▧", "♡", "∞"];

export default function HomeWeddingWebsitePromo() {
  return <section className="home-wedding-promo" aria-labelledby="home-wedding-title">
    <div className="home-wedding-heading">
      <h2 id="home-wedding-title">Create your own <em>wedding website</em> with us.</h2>
    </div>
    <div className="home-wedding-process-heading"><h3>How it works?</h3></div>
    <div className="home-wedding-steps" aria-label="How it works">
      {steps.map(([title, description], index) => <article className="home-wedding-step" key={title}>
        <div className="home-wedding-step-visual">
          <div className="home-wedding-step-icon" aria-hidden="true"><span>{stepIcons[index]}</span></div>
          <span className="home-wedding-number">{index + 1}</span>
        </div>
        <h3>{title}</h3>
        <p>{description}</p>
      </article>)}
    </div>
    <div className="home-wedding-actions">
      <WhatsAppLink>Connect over WhatsApp</WhatsAppLink>
      <a className="home-wedding-readmore" href="/wedding-websites">Read More <span aria-hidden="true">↗</span></a>
    </div>
  </section>;
}
