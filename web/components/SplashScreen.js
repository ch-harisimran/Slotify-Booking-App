// Branded loading splash — shown by SplashGate while the session/auth check
// is resolving on first load. Same visual language as the mobile boot
// splash: solid dark-teal ground with the pulse mark drawn straight onto it.
export default function SplashScreen() {
  return (
    <div className="splash">
      <div className="splash-content">
        <div className="splash-mark">
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden="true">
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
        </div>
        <p className="splash-word">Slotify</p>
        <p className="splash-tagline">Your health, one tap away</p>
      </div>
      <div className="splash-loader" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
