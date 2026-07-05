export default function Avatar({ name, color = '#1F6F5C', size = 36 }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  return (
    <div
      className="flex items-center justify-center rounded-full font-display font-semibold text-white shrink-0"
      style={{ backgroundColor: color, width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}
