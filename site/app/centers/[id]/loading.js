// Markaz sahifasi yuklanayotganda
export default function Loading() {
  return (
    <div className="wrap page" aria-busy="true" aria-label="Yuklanmoqda">
      <div className="sk sk-s" style={{ width: 220, marginBottom: 14 }} />
      <div className="sk sk-hero" />
      <div className="skcard" style={{ marginTop: 16 }}>
        <div className="skb">
          <div className="sk sk-h" />
          <div className="sk sk-s" />
          <div className="sk-row">{[0, 1, 2].map((i) => <div key={i} className="sk sk-fact" />)}</div>
          <div className="sk-row"><div className="sk sk-btn wide" /><div className="sk sk-btn" /><div className="sk sk-btn" /></div>
        </div>
      </div>
    </div>
  );
}
