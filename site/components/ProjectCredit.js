// Sayt pastidagi doimiy yozuv: loyiha egasi va ishlab chiquvchi logotipi
export default function ProjectCredit() {
  return (
    <div className="pcredit">
      <div className="wrap pcredit-in">
        <p className="pcredit-own">
          <b>Smart Combinator MChJ</b>
          <span className="l-uz">tasarrufidagi loyiha</span>
          <span className="l-ru" lang="ru" data-notr>— управляющая компания проекта</span>
        </p>
        <img className="pcredit-dev" src="/sanjars-it-teams.webp" alt="Developed by Sanjar's IT Teams" width="300" height="84" loading="lazy" decoding="async" />
      </div>
    </div>
  );
}
