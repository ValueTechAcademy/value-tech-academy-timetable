import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Value Tech Academy | Online Class Timetable',
  description: 'View the Value Tech Academy online class schedule and join live classes.',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
