import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import SplashGate from '../components/SplashGate';

export const metadata = {
  title: 'Slotify — Book an appointment',
  description: 'Browse services and book your next appointment.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Public+Sans:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <AuthProvider>
          <SplashGate>
            <Navbar />
            <main>
              <div className="container">{children}</div>
            </main>
          </SplashGate>
        </AuthProvider>
      </body>
    </html>
  );
}
