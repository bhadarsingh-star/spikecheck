// Saathi, the guide: an avatar and chat bubbles. The words come from lib/guide.ts.
export default function Saathi({ messages, role = "Your Glyko health guide · not a doctor" }: {
  messages: string[];
  role?: string;
}) {
  return (
    <div className="saathi">
      <div className="saathi-head">
        <div className="saathi-avatar" aria-hidden="true">S</div>
        <div>
          <p className="saathi-name">Saathi</p>
          <p className="saathi-role">{role}</p>
        </div>
      </div>
      <div className="saathi-chat">
        {messages.map((m) => (
          <p className="saathi-msg" key={m}>{m}</p>
        ))}
      </div>
    </div>
  );
}
