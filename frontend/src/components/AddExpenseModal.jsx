import { useState, useEffect } from 'react';
import * as api from '../api/services';
import Button from './Button';
import Input from './Input';

const CATEGORIES = ['General', 'Food', 'Rent', 'Travel', 'Utilities', 'Entertainment', 'Shopping'];

/**
 * members: [{ id, name, avatar_color }] - everyone eligible to be a payer/participant
 * onClose, onCreated: callbacks
 * groupId: pass a group id, or null for a direct friend expense (friendId required then)
 */
export default function AddExpenseModal({ members, groupId, friendId, currentUserId, onClose, onCreated }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('General');
  const [splitType, setSplitType] = useState('equal');
  const [paidBy, setPaidBy] = useState(currentUserId);
  const [participantIds, setParticipantIds] = useState(members.map((m) => m.id));
  const [customValues, setCustomValues] = useState({}); // for exact/percentage/shares
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Reset custom values when split type or participants change
    const defaults = {};
    participantIds.forEach((id) => {
      defaults[id] = customValues[id] || (splitType === 'shares' ? 1 : '');
    });
    setCustomValues(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splitType, participantIds.length]);

  const toggleParticipant = (id) => {
    setParticipantIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const amt = Number(amount);
    if (!description.trim()) return setError('Add a description for this expense.');
    if (!amt || amt <= 0) return setError('Enter a valid amount greater than zero.');
    if (participantIds.length === 0) return setError('Select at least one person to split with.');

    let participants;
    if (splitType === 'equal') {
      participants = participantIds.map((id) => ({ user_id: id, value: 1 }));
    } else {
      participants = participantIds.map((id) => ({ user_id: id, value: Number(customValues[id] || 0) }));
    }

    setSubmitting(true);
    try {
      await api.createExpense({
        group_id: groupId || null,
        description: description.trim(),
        amount: amt,
        category,
        split_type: splitType,
        payers: [{ user_id: paidBy, amount_paid: amt }],
        participants,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save this expense. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-line">
        <div className="px-6 py-4 border-b border-line flex items-center justify-between sticky top-0 bg-white">
          <h2 className="font-display text-xl text-ink">Add an expense</h2>
          <button onClick={onClose} className="text-muted hover:text-ink text-2xl leading-none" aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <Input
            label="Description"
            placeholder="e.g. Dinner at Cafe Coffee Day"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount (₹)"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <label className="block">
              <span className="block text-sm font-medium text-ink mb-1">Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-ink"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="block text-sm font-medium text-ink mb-1">Paid by</span>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(Number(e.target.value))}
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-ink"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>

          <div>
            <span className="block text-sm font-medium text-ink mb-2">Split</span>
            <div className="flex gap-2 flex-wrap">
              {[
                ['equal', 'Equally'],
                ['exact', 'Exact amounts'],
                ['percentage', 'Percentages'],
                ['shares', 'Shares'],
              ].map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSplitType(val)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    splitType === val
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-ink border-line hover:border-primary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-line rounded-lg divide-y divide-line">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-3 py-2">
                <input
                  type="checkbox"
                  checked={participantIds.includes(m.id)}
                  onChange={() => toggleParticipant(m.id)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="flex-1 text-sm text-ink">{m.name}</span>
                {splitType !== 'equal' && participantIds.includes(m.id) && (
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-24 rounded-md border border-line px-2 py-1 text-sm text-right font-mono"
                    placeholder={splitType === 'percentage' ? '%' : splitType === 'shares' ? 'shares' : '₹'}
                    value={customValues[m.id] ?? ''}
                    onChange={(e) => setCustomValues((prev) => ({ ...prev, [m.id]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-debit">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save expense'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
