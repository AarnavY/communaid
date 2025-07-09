import '../styles/globals.css';
import Providers from './providers';

export const metadata = {
  title: 'Communaid',
  description: 'Helping hands for those who once helped us.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
} 