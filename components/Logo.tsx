// The Glyko mark: a thali (circle) with a spike line inside.
// Drawn with currentColor, so it takes the colour of its parent.
export default function Logo() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="20" />
      <path d="M10 28h7l4-11 6 16 3-5h8" />
    </svg>
  );
}
