export default function FilterChips({ options, value, onChange }) {
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <div className="flex min-w-max items-center gap-2">
        {options.map((option) => {
          const active = option === value;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                active
                  ? 'border-border-strong bg-surface text-primary'
                  : 'border-border-subtle bg-surface text-secondary hover:border-border-strong'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
