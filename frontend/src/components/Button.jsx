export default function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-body font-medium text-sm transition-colors focus-visible:outline-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark',
    secondary: 'bg-ledger text-ink hover:bg-line',
    danger: 'bg-debit text-white hover:opacity-90',
    ghost: 'bg-transparent text-ink hover:bg-ledger',
  };
  return (
    <button type={type} className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
