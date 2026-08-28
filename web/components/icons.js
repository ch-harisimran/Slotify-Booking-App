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

export function IconHome(props) {
  return base(
    <>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </>,
    props
  );
}

export function IconList(props) {
  return base(
    <>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
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

export function IconPlus(props) {
  return base(
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
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

export function IconSend(props) {
  return base(<polygon points="3 11 22 2 13 21 11 13 3 11" />, props);
}
