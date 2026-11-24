interface FolderIconProps extends React.ComponentPropsWithoutRef<'svg'> {
  size?: number | string;
}

const FolderIcon: React.FC<FolderIconProps> = ({ size, style, ...others }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      style={{ width: size, height: size, ...style }}
      {...others}
    >
      <rect x="4" y="16" width="56" height="40" rx="4" ry="4" fill="#fde047" stroke="#000" strokeWidth="2" />

      <path d="M8 12h20l4 6h24a4 4 0 0 1 4 4v4H4v-8a6 6 0 0 1 6-6z" fill="#facc15" stroke="#000" strokeWidth="2" />

      <circle cx="12" cy="50" r="2" fill="#000" />
      <circle cx="52" cy="50" r="2" fill="#000" />
    </svg>
  );
};

export default FolderIcon;
