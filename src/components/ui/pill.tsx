const TONES = {
  good: "bg-success-light text-success",
  bad: "bg-danger-light text-danger",
  info: "bg-info-light text-info",
  neutral: "bg-surface-muted text-muted",
};

export type PillTone = keyof typeof TONES;

export function Pill({
  tone,
  children,
}: {
  tone: PillTone;
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
