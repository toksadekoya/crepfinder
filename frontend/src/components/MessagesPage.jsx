export default function MessagesPage() {
  const savedMessages = JSON.parse(localStorage.getItem('crepfinder_messages') ?? '[]');

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-[26px] font-medium text-primary">Messages</h1>
        <p className="pb-0.5 text-[12px] font-medium text-muted">Prototype inbox</p>
      </div>

      <div className="rounded-[10px] border border-border-subtle bg-surface p-5">
        <p className="text-[14px] leading-[1.55] text-secondary">
          CrepFinder includes basic non-real-time messaging so participants can contact a seller from the listing detail page.
          Messages are stored against the participant code and listing rather than being delivered as live chat.
        </p>
      </div>

      {savedMessages.length === 0 ? (
        <div className="rounded-[10px] border border-border-subtle bg-surface px-6 py-12 text-center">
          <p className="text-[14px] text-secondary">No local prototype messages yet.</p>
          <p className="mt-2 text-[12px] text-muted">Open a listing and use Message seller to create one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {savedMessages.map((message, index) => (
            <div key={`${message.created_at}-${index}`} className="rounded-[10px] border border-border-subtle bg-surface p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-tertiary">
                  Listing #{message.listing_id} · {message.participant_code}
                </p>
                <p className="text-[11px] text-muted">
                  {new Date(message.created_at).toLocaleString('en-GB')}
                </p>
              </div>
              <p className="mt-2 text-[14px] leading-[1.55] text-primary">{message.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
