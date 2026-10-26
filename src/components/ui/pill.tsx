const TONES = {
  good: "bg-success-light text-success",
  bad: "bg-danger-light text-danger",
  neutral: "bg-surface-muted text-muted",
};

export function Pill({
  tone,
  children,
}: {
  tone: keyof typeof TONES;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
