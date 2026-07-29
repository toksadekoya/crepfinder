import { useEffect, useState } from 'react';
import api from '../lib/api.js';

export default function MessagesPage({ authStatus }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(Boolean(authStatus?.authenticated));
  const [error, setError] = useState('');
  const savedMessages = JSON.parse(localStorage.getItem('crepfinder_messages') ?? '[]');

  useEffect(() => {
    if (!authStatus?.authenticated) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError('');

    api.get('/api/messages/me')
      .then(({ data }) => {
        if (active) setMessages(data);
      })
      .catch(() => {
        if (active) setError('Could not load messages.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authStatus?.authenticated]);

  const visibleMessages = authStatus?.authenticated ? messages : savedMessages;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-[26px] font-medium text-primary">Messages</h1>
        <p className="pb-0.5 text-[12px] font-medium text-muted">
          {authStatus?.authenticated ? 'Account inbox' : 'Guest inbox'}
        </p>
      </div>

      {loading ? (
        <div className="rounded-[10px] border border-border-subtle bg-surface px-6 py-12 text-center text-[14px] text-secondary">
          Loading messages...
        </div>
      ) : error ? (
        <div className="rounded-[10px] border border-border-subtle bg-surface px-6 py-12 text-center text-[14px] text-red-600">
          {error}
        </div>
      ) : visibleMessages.length === 0 ? (
        <div className="rounded-[10px] border border-border-subtle bg-surface px-6 py-12 text-center">
          <p className="text-[14px] text-secondary">No messages yet.</p>
          <p className="mt-2 text-[12px] text-muted">Open a listing and use Message seller to start a thread.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleMessages.map((message, index) => (
            <div key={`${message.id ?? message.created_at}-${index}`} className="rounded-[10px] border border-border-subtle bg-surface p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-tertiary">
                  {message.brand && message.model ? `${message.brand} ${message.model}` : `Listing #${message.listing_id}`}
                </p>
                <p className="text-[11px] text-muted">
                  {new Date(message.created_at).toLocaleString('en-GB')}
                </p>
              </div>
              <p className="mt-2 text-[14px] leading-[1.55] text-primary">{message.body}</p>
              <p className="mt-2 text-[12px] text-muted">
                {message.sender_role === 'seller' ? 'Seller' : 'Buyer'}
                {message.buyer_email ? ` · ${message.buyer_email}` : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
