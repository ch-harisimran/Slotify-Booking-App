import SplashScreen from '../components/SplashScreen';

// Next.js shows this automatically while a route segment is being prepared
// (App Router's built-in Suspense boundary) — same branded splash as the
// initial-load gate, so a route transition never flashes blank white.
export default function Loading() {
  return <SplashScreen />;
}
