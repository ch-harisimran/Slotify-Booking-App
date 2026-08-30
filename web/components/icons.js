// Small hand-rolled icon set (no external icon package) — each accepts
// `size` and `className`/`style` like a normal SVG.

function base(children, { size = 18, strokeWidth = 1.8, ...props } = {}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconSearch(props) {
  return base(
    <>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>,
    props
  );
}

export function IconBell(props) {
  return base(
    <>
      <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </>,
    props
  );
}

export function IconCalendar(props) {
  return base(
    <>
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>,
    props
  );
}

export function IconClock(props) {
  return base(
    <>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15.5 14" />
    </>,
    props
  );
}

export function IconChevronLeft(props) {
  return base(<polyline points="15 18 9 12 15 6" />, props);
}

export function IconChevronRight(props) {
  return base(<polyline points="9 18 15 12 9 6" />, props);
}

export function IconCheck(props) {
  return base(<polyline points="20 6 9 17 4 12" />, props);
}

export function IconSparkles(props) {
  return base(
    <>
      <path d="M12 3l1.6 4.2L18 9l-4.4 1.8L12 15l-1.6-4.2L6 9l4.4-1.8L12 3z" />
      <path d="M19 15l.8 2.1L22 18l-2.2.9L19 21l-.8-2.1L16 18l2.2-.9L19 15z" />
    </>,
    props
  );
}

// Slotify's AI assistant mark — a small friendly face rather than a generic
// sparkle, so the assistant reads as a character with personality. Uses
// currentColor like the rest of the set, so it drops into any tinted chip.
export function IconMascot(props) {
  return base(
    <>
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="7" />
      <circle cx="9" cy="11.1" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15" cy="11.1" r="1.15" fill="currentColor" stroke="none" />
      <path d="M8.8 14.8c1 1.3 5.4 1.3 6.4 0" />
      <circle cx="18.3" cy="5.7" r="1.15" fill="currentColor" stroke="none" />
    </>,
    props
  );
}

export function IconHome(props) {
  return base(
    <>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </>,
    props
  );
}

export function IconUser(props) {
  return base(
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </>,
    props
  );
}

export function IconLogOut(props) {
  return base(
    <>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </>,
    props
  );
}

export function IconX(props) {
  return base(
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>,
    props
  );
}

export function IconShield(props) {
  return base(<path d="M12 2l8 4v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-4z" />, props);
}

export function IconScissors(props) {
  return base(
    <>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </>,
    props
  );
}

/* ---------- Specialty icon set ---------- */

export function IconHeartPulse(props) {
  return base(
    <path d="M20 8.5c0-2.5-2-4.5-4.4-4.5-1.6 0-3 .8-3.6 2-.6-1.2-2-2-3.6-2C6 4 4 6 4 8.5c0 .9.2 1.7.6 2.5H8l1.6-2.8L11.4 14 13 9.5h3.6l.6-1H20z" />,
    props
  );
}

export function IconDroplet(props) {
  return base(<path d="M12 3s7 7.5 7 12a7 7 0 01-14 0c0-4.5 7-12 7-12z" />, props);
}

export function IconBrain(props) {
  return base(
    <>
      <path d="M9 4a3 3 0 00-3 3 3 3 0 00-2 2.8V13a3 3 0 002.3 2.9A3 3 0 009 19a3 3 0 003-3V7a3 3 0 00-3-3z" />
      <path d="M15 4a3 3 0 013 3 3 3 0 012 2.8V13a3 3 0 01-2.3 2.9A3 3 0 0115 19a3 3 0 01-3-3V7a3 3 0 013-3z" />
    </>,
    props
  );
}

export function IconBone(props) {
  return base(
    <path d="M7.5 4.5a2 2 0 11.9 3.8l6.3 6.3a2 2 0 11-2.7 2.7l-6.3-6.3a2 2 0 11-.9-3.8 2 2 0 012.7-2.7zm9 0a2 2 0 01-.9 3.8 2 2 0 01-2.7-2.7 2 2 0 012.7-2.7 2 2 0 01.9 1.6z" />,
    props
  );
}

export function IconVenus(props) {
  return base(
    <>
      <circle cx="12" cy="9" r="5" />
      <line x1="12" y1="14" x2="12" y2="21" />
      <line x1="8.5" y1="18" x2="15.5" y2="18" />
    </>,
    props
  );
}

export function IconBabyBottle(props) {
  return base(
    <>
      <rect x="8" y="9" width="8" height="11" rx="2.5" />
      <path d="M9.5 9V6.5a2.5 2.5 0 015 0V9" />
      <line x1="8" y1="13" x2="16" y2="13" />
    </>,
    props
  );
}

export function IconTooth(props) {
  return base(
    <path d="M6 5.5C6 3.6 7.6 2 9.7 2c.9 0 1.6.4 2.3 1 .7-.6 1.4-1 2.3-1C16.4 2 18 3.6 18 5.5c0 1-.3 1.7-.7 2.9l-1.5 8.4c-.2 1.2-1.2 2.2-2.4 2.2-1.1 0-2-.8-2.2-1.9l-.7-4c-.1-.6-1-.6-1.1 0l-.7 4c-.2 1.1-1.1 1.9-2.2 1.9-1.2 0-2.2-1-2.4-2.2L6.7 8.4C6.3 7.2 6 6.5 6 5.5z" />,
    props
  );
}

export function IconHeadThought(props) {
  return base(
    <>
      <path d="M8 20v-2.3a6 6 0 114.8 0V20" />
      <circle cx="18.5" cy="6" r="1.4" />
      <circle cx="16" cy="4" r="0.9" />
    </>,
    props
  );
}

export function IconEar(props) {
  return base(
    <path d="M15 4a5 5 0 00-5 5c0 2 1 2.6 1 4.5A2.5 2.5 0 018.5 16 2.5 2.5 0 016 13.5M15 4a6 6 0 016 6c0 5-5 5-5 9a3 3 0 01-6 0" />,
    props
  );
}

export function IconEye(props) {
  return base(
    <>
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" />
      <circle cx="12" cy="12" r="2.6" />
    </>,
    props
  );
}

export function IconApple(props) {
  return base(
    <>
      <path d="M12 8.5c-3.5-2.3-8 0-8 5 0 4 2.7 7.5 5 7.5 1.1 0 1.4-.5 3-.5s1.9.5 3 .5c2.1 0 5-3 5-7.5 0-4.6-4-6.8-7-5" />
      <path d="M12 8.5c0-2 .8-3.2 2.3-4" />
    </>,
    props
  );
}

export function IconMail(props) {
  return base(
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3.5 6.5l8.5 6.5 8.5-6.5" />
    </>,
    props
  );
}

export function IconLock(props) {
  return base(
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 018 0v3" />
    </>,
    props
  );
}

export function IconSend(props) {
  return base(<polygon points="3 11 22 2 13 21 11 13 3 11" />, props);
}

export function IconHeart({ filled = false, ...props } = {}) {
  return base(
    <path
      d="M12 21s-7.5-4.6-10.2-9.3C.2 8.6 1.6 5 5 4.2c2-.5 4 .3 5 2 1-1.7 3-2.5 5-2 3.4.8 4.8 4.4 3.2 7.5C19.5 16.4 12 21 12 21z"
      fill={filled ? 'currentColor' : 'none'}
    />,
    props
  );
}

export function IconStar({ filled = true, ...props } = {}) {
  return base(
    <polygon
      points="12 2.5 15.1 8.8 22 9.8 17 14.7 18.2 21.5 12 18.3 5.8 21.5 7 14.7 2 9.8 8.9 8.8 12 2.5"
      fill={filled ? 'currentColor' : 'none'}
    />,
    props
  );
}

export function IconStethoscope(props) {
  return base(
    <>
      <path d="M5 3v6a4 4 0 008 0V3" />
      <path d="M9 13v2a6 6 0 0012 0v-3" />
      <circle cx="21" cy="10" r="2" />
    </>,
    props
  );
}

export function IconBriefcase(props) {
  return base(
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
    </>,
    props
  );
}

