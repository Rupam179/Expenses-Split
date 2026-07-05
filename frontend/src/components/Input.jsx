export default function Input({ label, error, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-ink mb-1">{label}</span>}
      <input
        className={`w-full rounded-lg border border-line bg-white px-3 py-2.5 text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-primary ${className}`}
        {...props}
      />
      {error && <span className="block text-sm text-debit mt-1">{error}</span>}
    </label>
  );
}
