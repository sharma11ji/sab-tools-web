export default function SkeletonGrid({ count = 18 }) {
  return (
    <div className="grid" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div className="card" key={i}>
          <div className="skeleton sk-img" />
          <div className="skeleton sk-line" />
        </div>
      ))}
    </div>
  );
}
