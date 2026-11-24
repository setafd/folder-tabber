export const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    style={{ transform: expanded ? 'rotate(90deg)' : undefined }}
  >
    <path d="m6 4 4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
