// Qidiruv natijalari yuklanayotganda: kulrang skelet kartalar
export default function Loading() {
  return (
    <div className="wrap page spage" aria-busy="true" aria-label="Yuklanmoqda">
      <div className="sk sk-h" />
      <div className="stool"><div className="sk sk-bar" /><div className="sk sk-btn" /></div>
      <div className="sk-row">{[0, 1, 2, 3].map((i) => <div key={i} className="sk sk-chip" />)}</div>
      <div className="ccards">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skcard">
            <div className="sk sk-img" />
            <div className="skb"><div className="sk sk-t" /><div className="sk sk-s" /><div className="sk-row"><div className="sk sk-pill" /><div className="sk sk-pill" /><div className="sk sk-pill" /></div></div>
          </div>
        ))}
      </div>
    </div>
  );
}
