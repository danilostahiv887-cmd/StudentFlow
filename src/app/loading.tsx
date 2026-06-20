export default function Loading() {
  return (
    <div className="route-loading" role="status" aria-live="polite">
      <span className="route-loader" aria-hidden="true" />
      <span>Завантаження</span>
    </div>
  );
}
