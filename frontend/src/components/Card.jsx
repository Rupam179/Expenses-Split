export default function Card({ children, className = '', title, action }) {
  return (
    <div className={`bg-white rounded-xl border border-line shadow-sm overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-line">
          {title && <h3 className="font-display text-lg text-ink">{title}</h3>}
          {action}
        </div>
      )}
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}
