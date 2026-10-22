// The Glyko mark: a lowercase g whose bowl holds a haldi spike line.
// The g takes its parent's colour (currentColor); the spike is always haldi.
export default function Logo() {
  return (
    <svg
      viewBox="0 0 48 52"
      fill="none"
      stroke="currentColor"
      strokeWidth="4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="22" cy="20" r="15" />
      <path d="M37 8v24c0 10-7 16-16 16-5 0-9-2-11-5" />
      <path d="M12 22h4l3-7 4 10 2-3h4" stroke="var(--haldi)" strokeWidth="3.5" />
    </svg>
  );
}
