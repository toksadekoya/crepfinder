import { useEffect, useState } from 'react';
import api from '../lib/api.js';
import SocialVerificationBadge from './SocialVerificationBadge.jsx';

const sellerOptions = [
  { id: 1, label: '@sneakerhead1' },
  { id: 2, label: '@kickseller' },
  { id: 3, label: '@airmax_fan' },
];

const platformOptions = ['Instagram', 'TikTok', 'X', 'YouTube', 'Depop', 'Other'];

export default function SellerVerificationPage() {
  const [sellerId, setSellerId] = useState(1);
  const [platform, setPlatform] = useState('Instagram');
  const [profileUrl, setProfileUrl] = useState('');
  const [username, setUsername] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceText, setEvidenceText] = useState('');
  const [requests, setRequests] = useState([]);
  const [activeRequest, setActiveRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchRequests = async (id = sellerId) => {
    setLoading(true);
    setError('');

    try {
      const { data } = await api.get('/api/social-verification/me', {
        params: { user_id: id },
      });
      setRequests(data);
      setActiveRequest(data[0] ?? null);
    } catch {
      setRequests([]);
      setActiveRequest(null);
      setError('Could not load verification status. Check that the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(sellerId);
  }, [sellerId]);

  const startVerification = async () => {
    setMessage('');
    setError('');

    try {
      const { data } = await api.post('/api/social-verification/start', {
        user_id: sellerId,
        platform,
        profile_url: profileUrl,
        username,
      });

      setActiveRequest(data);
      setRequests((current) => [data, ...current]);
      setMessage('Challenge code generated. Add it to your social profile, then submit evidence below.');
    } catch (err) {
      setError(err.response?.data?.error ?? 'Could not start verification.');
    }
  };

  const submitEvidence = async () => {
    if (!activeRequest?.id) {
      setError('Start a verification request before submitting evidence.');
      return;
    }

    setMessage('');
    setError('');

    try {
      const { data } = await api.post('/api/social-verification/submit', {
        id: activeRequest.id,
        user_id: sellerId,
        evidence_url: evidenceUrl,
        evidence_text: evidenceText,
      });

      setActiveRequest(data);
      setRequests((current) => current.map((item) => (item.id === data.id ? data : item)));
      setMessage('Evidence submitted for moderation.');
    } catch (err) {
      setError(err.response?.data?.error ?? 'Could not submit evidence.');
    }
  };

  return (
    <div className="mx-auto max-w-[880px] space-y-8 py-4 md:py-8">
      <div className="space-y-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-tertiary">Seller verification</p>
        <h1 className="text-[26px] font-medium tracking-[-0.03em] text-primary">Social profile challenge</h1>
        <p className="max-w-[680px] text-[14px] leading-[1.55] text-secondary">
          Link a seller social profile, generate a unique CrepFinder challenge code, and submit evidence for moderation.
          Approved profiles appear to buyers as socially verified trust cues.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-4 rounded-[10px] border border-border-subtle bg-surface p-5">
          <h2 className="text-[18px] font-medium tracking-[-0.02em] text-primary">Start verification</h2>

          <label className="block space-y-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-tertiary">Seller</span>
            <select
              value={sellerId}
              onChange={(event) => setSellerId(Number(event.target.value))}
              className="w-full rounded-[10px] border border-border-subtle bg-page px-3 py-2 text-[14px] text-primary"
            >
              {sellerOptions.map((seller) => (
                <option key={seller.id} value={seller.id}>{seller.label}</option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-tertiary">Platform</span>
            <select
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
              className="w-full rounded-[10px] border border-border-subtle bg-page px-3 py-2 text-[14px] text-primary"
            >
              {platformOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-tertiary">Profile URL</span>
            <input
              value={profileUrl}
              onChange={(event) => setProfileUrl(event.target.value)}
              placeholder="https://instagram.com/username"
              className="w-full rounded-[10px] border border-border-subtle bg-page px-3 py-2 text-[14px] text-primary placeholder:text-muted"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-tertiary">Username</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="sellername"
              className="w-full rounded-[10px] border border-border-subtle bg-page px-3 py-2 text-[14px] text-primary placeholder:text-muted"
            />
          </label>

          <button
            type="button"
            onClick={startVerification}
            className="w-full rounded-full bg-primary py-3 text-[14px] font-medium text-surface transition-colors hover:bg-secondary"
          >
            Generate challenge code
          </button>
        </section>

        <section className="space-y-4 rounded-[10px] border border-border-subtle bg-surface p-5">
          <h2 className="text-[18px] font-medium tracking-[-0.02em] text-primary">Current status</h2>

          {loading ? (
            <p className="text-[14px] text-muted">Loading verification status...</p>
          ) : activeRequest ? (
            <div className="space-y-4">
              <SocialVerificationBadge verification={activeRequest} />

              {activeRequest.challenge_code && activeRequest.status !== 'verified' && (
                <div className="rounded-[10px] border border-border-subtle bg-page p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-tertiary">Challenge code</p>
                  <code className="mt-2 block break-all rounded-[8px] bg-surface px-3 py-2 text-[18px] font-medium text-primary">
                    {activeRequest.challenge_code}
                  </code>
                  <p className="mt-3 text-[13px] leading-[1.55] text-secondary">
                    Place this code in your profile bio, a public post, or a profile screenshot before submitting evidence.
                  </p>
                </div>
              )}

              {activeRequest.status !== 'verified' && (
                <div className="space-y-3">
                  <label className="block space-y-2">
                    <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-tertiary">Evidence URL</span>
                    <input
                      value={evidenceUrl}
                      onChange={(event) => setEvidenceUrl(event.target.value)}
                      placeholder="Link to post, profile, or hosted screenshot"
                      className="w-full rounded-[10px] border border-border-subtle bg-page px-3 py-2 text-[14px] text-primary placeholder:text-muted"
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-tertiary">Evidence notes</span>
                    <textarea
                      value={evidenceText}
                      onChange={(event) => setEvidenceText(event.target.value)}
                      rows={4}
                      placeholder="Describe where the challenge code appears."
                      className="w-full rounded-[10px] border border-border-subtle bg-page px-3 py-2 text-[14px] text-primary placeholder:text-muted"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={submitEvidence}
                    className="rounded-full border border-border-strong px-5 py-2.5 text-[14px] font-medium text-primary transition-colors hover:bg-subtle"
                  >
                    Submit evidence
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[14px] leading-[1.55] text-secondary">
              No social verification request has been started for this seller.
            </p>
          )}

          {message && <p role="status" className="text-[13px] text-secondary">{message}</p>}
          {error && <p role="alert" className="text-[13px] text-red-600">{error}</p>}
        </section>
      </div>

      {requests.length > 1 && (
        <section className="space-y-3">
          <h2 className="text-[18px] font-medium tracking-[-0.02em] text-primary">Previous requests</h2>
          <div className="grid gap-2">
            {requests.slice(1).map((request) => (
              <button
                key={request.id}
                type="button"
                onClick={() => setActiveRequest(request)}
                className="rounded-[10px] border border-border-subtle bg-surface px-4 py-3 text-left text-[13px] text-secondary transition-colors hover:border-border-strong"
              >
                {request.platform} · {request.status}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
