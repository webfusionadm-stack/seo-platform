export default function SakuraParticles() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <span key={i} className="sakura-particle">🌸</span>
      ))}
    </div>
  );
}
