import { useState, useEffect } from 'react';
import api from '../lib/api.js';

const QUESTIONS = [
  { key: 'q1', subscale: 'Competence',          text: 'This seller seems knowledgeable about the sneakers they sell.' },
  { key: 'q2', subscale: 'Competence',          text: 'This seller appears capable of fulfilling this transaction reliably.' },
  { key: 'q3', subscale: 'Benevolence',         text: 'I believe this seller would act in my best interest.' },
  { key: 'q4', subscale: 'Benevolence',         text: 'I feel this seller genuinely cares about buyers.' },
  { key: 'q5', subscale: 'Integrity',           text: "This seller's listing description seems honest and accurate." },
  { key: 'q6', subscale: 'Trusting Intentions', text: 'I would feel comfortable purchasing from this seller.' },
  { key: 'q7', subscale: 'Trusting Intentions', text: 'I intend to proceed with this purchase.' },
];

const LABELS = ['Strongly\nDisagree', '', 'Somewhat\nDisagree', 'Neutral', 'Somewhat\nAgree', '', 'Strongly\nAgree'];

const STAGES = { SURVEY: 'survey', PROCESSING: 'processing' };

export default function TrustModal({ listing, condition, participant, onComplete, onClose }) {
  const [responses, setResponses] = useState({});
  const [stage, setStage] = useState(STAGES.SURVEY);
  const [error, setError] = useState('');

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const allAnswered = QUESTIONS.every(q => responses[q.key] != null);

  const handleSubmit = async () => {
    if (!allAnswered) {
      setError('Please answer all questions before continuing.');
      return;
    }
    setError('');
    setStage(STAGES.PROCESSING);

    const payload = {
      listing_id: listing.id,
      condition_name: condition,
      participant_id: participant?.participantCode,
      q1: responses.q1,
      q2: responses.q2,
      q3: responses.q3,
      q4: responses.q4,
      q5: responses.q5,
      q6: responses.q6,
      q7: responses.q7,
    };

    try {
      await api.post('/api/trust', payload);
      await api.post('/api/purchase-requests', {
        listing_id: listing.id,
        participant_code: participant?.participantCode,
      });
    } catch {
      // Save locally as fallback so the flow still completes
      const saved = JSON.parse(localStorage.getItem('trust_measurements') ?? '[]');
      saved.push({ ...payload, saved_at: new Date().toISOString() });
      localStorage.setItem('trust_measurements', JSON.stringify(saved));
    }

    setTimeout(() => onComplete(), 900);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-[16px] border border-border-subtle bg-surface shadow-card">

        <div className="shrink-0 border-b border-border-subtle px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[18px] font-medium text-primary">
                Before You Buy
              </h2>
              {stage === STAGES.SURVEY && (
                <p className="mt-1 text-[12px] text-secondary">
                  Help us understand your trust in this seller. This takes about one minute.
                </p>
              )}
            </div>
            <button onClick={onClose} className="text-[20px] leading-none text-muted transition-colors hover:text-primary">✕</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {stage === STAGES.SURVEY && (
            <div className="space-y-6">
              <div className="rounded-[10px] bg-subtle p-3 text-[14px] text-secondary">
                <span className="font-medium text-primary">{listing.brand} {listing.model}</span>
                {' '}— £{listing.price} · Size {listing.size}
              </div>

              <p className="text-[14px] leading-[1.55] text-secondary">
                Rate each statement from <strong>1 (Strongly Disagree)</strong> to <strong>7 (Strongly Agree)</strong>:
              </p>

              {QUESTIONS.map((q, i) => {
                const prev = i > 0 ? QUESTIONS[i - 1].subscale : null;
                const showHeader = q.subscale !== prev;
                return (
                  <div key={q.key}>
                    {showHeader && (
                      <p className="mb-3 mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-tertiary">
                        {q.subscale}
                      </p>
                    )}
                    <div className="space-y-3">
                      <p className="text-[14px] font-medium leading-[1.55] text-primary">{q.text}</p>
                      <div className="flex items-end justify-between gap-1">
                        {[1, 2, 3, 4, 5, 6, 7].map(val => (
                          <label key={val} className="flex flex-col items-center gap-1 cursor-pointer flex-1">
                            <input
                              type="radio"
                              name={q.key}
                              value={val}
                              checked={responses[q.key] === val}
                              onChange={() => setResponses(r => ({ ...r, [q.key]: val }))}
                              className="sr-only"
                            />
                            <div
                              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                                responses[q.key] === val
                                  ? 'scale-110 border-border-strong bg-primary text-surface'
                                  : 'border-border-subtle text-secondary hover:border-border-strong hover:text-primary'
                              }`}
                            >
                              {val}
                            </div>
                            <span className="hidden whitespace-pre-line text-center text-[10px] leading-tight text-muted sm:block">
                              {LABELS[val - 1]}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}

              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          )}

          {stage === STAGES.PROCESSING && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-stone-200 border-t-primary" />
              <p className="font-medium text-secondary">Processing your request…</p>
              <p className="text-xs text-muted">Saving your responses</p>
            </div>
          )}

        </div>

        <div className="shrink-0 border-t border-border-subtle px-6 py-4">
          {stage === STAGES.SURVEY && (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              className={`w-full rounded-full py-3 text-sm font-medium transition-all ${
                allAnswered
                  ? 'bg-primary text-surface hover:bg-secondary'
                  : 'cursor-not-allowed bg-subtle text-muted'
              }`}
            >
              {allAnswered ? 'Submit & Request Purchase →' : `${Object.keys(responses).length}/7 answered`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
