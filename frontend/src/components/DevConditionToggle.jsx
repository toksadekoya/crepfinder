export default function DevConditionToggle({ condition, setCondition }) {
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-30 flex items-center gap-2 rounded-full border border-border-subtle bg-surface/95 px-2 py-2 shadow-card backdrop-blur">
      <span className="pl-1 text-[10px] font-medium uppercase tracking-[0.12em] text-tertiary">
        Dev
      </span>
      <div className="flex items-center rounded-full border border-border-subtle bg-page p-1" role="group" aria-label="Development condition switcher">
        {['A', 'B'].map((value) => {
          const active = value === condition;

          return (
            <button
              key={value}
              type="button"
              onClick={() => setCondition(value)}
              aria-pressed={active}
              aria-label={`Show condition ${value}`}
              className={`h-7 w-7 rounded-full text-[11px] font-medium transition-colors ${
                active
                  ? 'bg-primary text-surface'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              {value}
            </button>
          );
        })}
      </div>
    </div>
  );
}
