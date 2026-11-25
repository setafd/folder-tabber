interface FolderIconProps extends React.ComponentPropsWithoutRef<'svg'> {
  size?: number | string;
}

const FolderIcon: React.FC<FolderIconProps> = ({ size, style, ...others }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: size, height: size, ...style }}
      {...others}
    >
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </svg>
  );
};

export default FolderIcon;
