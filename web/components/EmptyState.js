// Flat single-tone illustrations for empty states — replaces plain gray
// sentences with a small drawn moment. Variant controls the artwork only;
// title/subtitle/children (e.g. a CTA link) are passed by the caller.

function Art({ variant }) {
  const stroke = '#0E6B58';
  const soft = '#DCEEE8';

  if (variant === 'favorites') {
    return (
      <svg width="104" height="104" viewBox="0 0 104 104" fill="none">
        <circle cx="52" cy="52" r="50" fill={soft} />
        <path
          d="M52 68s-20-11.5-20-26.5C32 33 38 28 45 28c3.5 0 6.5 1.8 7 4.5.5-2.7 3.5-4.5 7-4.5 7 0 13 5 13 13.5C72 56.5 52 68 52 68z"
          stroke={stroke}
          strokeWidth="3"
          strokeLinejoin="round"
          strokeDasharray="4 5"
        />
      </svg>
    );
  }

  if (variant === 'search') {
    return (
      <svg width="104" height="104" viewBox="0 0 104 104" fill="none">
        <circle cx="52" cy="52" r="50" fill={soft} />
        <circle cx="46" cy="46" r="16" stroke={stroke} strokeWidth="3" />
        <line x1="57" y1="57" x2="70" y2="70" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
        <line x1="41" y1="46" x2="51" y2="46" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="0.5 5" />
      </svg>
    );
  }

  // bookings (default)
  return (
    <svg width="104" height="104" viewBox="0 0 104 104" fill="none">
      <circle cx="52" cy="52" r="50" fill={soft} />
      <rect x="30" y="34" width="44" height="38" rx="6" stroke={stroke} strokeWidth="3" />
      <line x1="30" y1="46" x2="74" y2="46" stroke={stroke} strokeWidth="3" />
      <line x1="40" y1="28" x2="40" y2="38" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
      <line x1="64" y1="28" x2="64" y2="38" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
      <circle cx="52" cy="59" r="6" stroke={stroke} strokeWidth="2.5" strokeDasharray="3 4" />
    </svg>
  );
}

export default function EmptyState({ variant = 'bookings', title, subtitle, children, style }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', ...style }}>
      <div style={{ display: 'inline-flex' }}>
        <Art variant={variant} />
      </div>
      {title && <p style={{ margin: '16px 0 0', fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '1.05rem' }}>{title}</p>}
      {subtitle && <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.88rem' }}>{subtitle}</p>}
      {children && <div style={{ marginTop: 14 }}>{children}</div>}
    </div>
  );
}
