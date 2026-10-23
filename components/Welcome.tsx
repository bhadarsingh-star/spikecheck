import Logo from "@/components/Logo";

// The home page a first-time visitor sees: the brand, the promise, and a way in.
export default function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="welcome">
      <section className="welcome-hero">
        <svg className="welcome-ring" viewBox="0 0 560 560" aria-hidden="true">
          <circle cx="280" cy="280" r="250" fill="none" stroke="#2B7C55" strokeWidth="40" />
          <path d="M70 300h120l60-150 90 230 45-75h105" fill="none" stroke="#F2B71F" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="welcome-inner">
          <div className="welcome-brand">
            <Logo />
            <span className="welcome-wordmark">glyko</span>
          </div>
          <h1 className="welcome-tagline">Know which meals spike you.</h1>
          <p className="welcome-sub">
            A meal-by-meal blood sugar guide for Indians with type 2 diabetes, built for home-cooked food.
          </p>
          <div className="welcome-actions">
            <button className="welcome-start" onClick={onStart}>Get started</button>
            <a className="welcome-demo" href="/demo">See the demo</a>
          </div>
        </div>
      </section>

      <section className="welcome-steps">
        <ol>
          <li>
            <span className="welcome-num" aria-hidden="true">1</span>
            <div>
              <h2>Check your sugar, snap your plate</h2>
              <p>Glyko recognises dal, roti, dosa and more, with household portions you can fix.</p>
            </div>
          </li>
          <li>
            <span className="welcome-num haldi" aria-hidden="true">2</span>
            <div>
              <h2>See the spike before you eat</h2>
              <p>An expected spike, calories and carbs, and lighter swaps that fit Indian meals.</p>
            </div>
          </li>
          <li>
            <span className="welcome-num" aria-hidden="true">3</span>
            <div>
              <h2>Learn what suits your body</h2>
              <p>Check again after 2 hours. Every meal you log makes Glyko more personal.</p>
            </div>
          </li>
        </ol>
        <p className="welcome-note">Free to try. Your profile and meals stay on this phone. For personal tracking, not medical advice.</p>
      </section>
    </div>
  );
}
