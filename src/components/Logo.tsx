export default function Logo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      style={{ display: "block", flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="logoBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="120" fill="url(#logoBg)" />
      <path
        d="M148 128 h216 a20 20 0 0 1 20 20 v216 a20 20 0 0 1 -32.5 15.5 L332 368 l-36 24 -36 -24 -36 24 -36 -24 -36 24 -36 -24 a20 20 0 0 1 -32.5 -15.5 V148 a20 20 0 0 1 20 -20z"
        fill="#ffffff"
        opacity="0.96"
      />
      <rect x="180" y="168" width="152" height="16" rx="8" fill="#0ea5e9" opacity="0.95" />
      <rect x="180" y="208" width="120" height="12" rx="6" fill="#0ea5e9" opacity="0.5" />
      <rect x="180" y="240" width="152" height="12" rx="6" fill="#0ea5e9" opacity="0.5" />
      <rect x="180" y="272" width="100" height="12" rx="6" fill="#0ea5e9" opacity="0.35" />
      <path
        d="M180 324 h48 M180 324 v6 h18 a14 14 0 0 1 0 28 h-18 M192 358 l24 30"
        stroke="#0ea5e9"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.9"
      />
    </svg>
  );
}
