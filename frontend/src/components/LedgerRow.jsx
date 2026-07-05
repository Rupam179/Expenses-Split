import Avatar from './Avatar';

/**
 * The app's signature visual motif: an old-ledger-book row with a dotted
 * leader line between the name and the amount, like a handwritten receipt.
 * Green amount = they're owed money. Red amount = they owe money.
 */
export default function LedgerRow({ name, color, amount, rightLabel }) {
  const isPositive = amount > 0;
  const isZero = Math.abs(amount) < 0.01;
  const amountColor = isZero ? 'text-muted' : isPositive ? 'text-credit' : 'text-debit';

  return (
    <div className="flex items-center py-3">
      <Avatar name={name} color={color} size={32} />
      <span className="ml-3 font-body text-ink truncate">{name}</span>
      <span className="leader-line" />
      <div className="text-right shrink-0">
        <span className={`font-mono font-semibold ${amountColor}`}>
          {isZero ? 'settled up' : `₹${Math.abs(amount).toFixed(2)}`}
        </span>
        {rightLabel && <div className="text-xs text-muted">{rightLabel}</div>}
      </div>
    </div>
  );
}
