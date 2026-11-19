import Search from './search/page';

// Bosh sahifa: saytga kirganda va logotip/menyu orqali qaytganda bir xil ko'rinish —
// sarlavha, qidiruv, kurs bo'limlari, saralash va markazlar kartalari (OLX uslubi)
export const dynamic = 'force-dynamic';
export const metadata = { alternates: { canonical: '/' } };

export default function Home() {
  return <Search searchParams={{}} home />;
}
