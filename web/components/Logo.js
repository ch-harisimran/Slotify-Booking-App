// Slotify mark: a pulse line running through a rounded square, with a coral
// "appointment dot" — reads as both a heartbeat (health) and a check mark
// pointer (booking) at once. Used everywhere the old plain calendar glyph
// used to be: navbar, login, favicon source.
export default function Logo({ size = 32, rounded = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none" aria-hidden="true">
      <rect width="52" height="52" rx={rounded} fill="#0E6B58" />
      <path
        d="M12 28.5h6.2l3-8.5 4.4 17 3.6-11 2.4 4.5H40"
        stroke="#F2FBF8"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="40" cy="12.5" r="4.5" fill="#E1603A" />
    </svg>
  );
}
