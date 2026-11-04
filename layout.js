import './globals.css';
import { Plus_Jakarta_Sans, Kaushan_Script } from 'next/font/google';
import Nav from '../components/Nav';

const sans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--sans' });
const script = Kaushan_Script({ subsets: ['latin'], weight: '400', variable: '--script' });

export const metadata = {
  title: "EduSearcher | Sizga mos o'quv markazni toping",
  description: "O'zbekistondagi o'quv markazlar: kurs, daraja va manzilingizga qarab eng mos markazni toping."
};

export default function RootLayout({ children }) {
  return (
    <html lang="uz" className={`${sans.variable} ${script.variable}`}>
      <body>
        <Nav />
        <main>{children}</main>
        <footer>© EduSearcher · edusarcher.uz · O'zbekiston o'quv markazlari katalogi</footer>
      </body>
    </html>
  );
}
