import CenterSignup from '../../components/CenterSignup';

export const metadata = {
  title: "O'quv markazini qo'shish | EduSearcher",
  description: "O'quv markazingizni EduSearcher'ga bepul qo'shing: qidiruv va xaritada chiqing, arizalarni kabinetda qabul qiling.",
  alternates: { canonical: '/markaz-royxat' }
};

export default function Page() {
  return <div className="wrap page"><CenterSignup /></div>;
}
