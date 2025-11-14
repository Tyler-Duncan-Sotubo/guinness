// DividerWithText.tsx
type DividerWithTextProps = {
  text?: string;
  className?: string; // optional wrapper overrides
};

export default function DividerWithText({
  text = "OR",
  className = "",
}: DividerWithTextProps) {
  return (
    <div
      className={`flex items-center gap-3 text-sm text-gray-600 ${className}`}
      role="separator"
      aria-label={text}
    >
      <span className="h-px flex-1 bg-gray-200" />
      <span className="select-none px-2 font-bold tracking-wide text-lg">
        {text}
      </span>
      <span className="h-px flex-1 bg-gray-200" />
    </div>
  );
}
