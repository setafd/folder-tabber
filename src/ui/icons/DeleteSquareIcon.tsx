interface DeleteSquareIconProps extends React.ComponentPropsWithoutRef<'svg'> {
  size?: number | string;
}

const DeleteSquareIcon: React.FC<DeleteSquareIconProps> = ({ size, style, ...others }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: size, height: size, ...style }}
      {...others}
    >
      <path d="M18 6 6 18" stroke="currentColor" />
      <path d="m6 6 12 12" stroke="currentColor" />
    </svg>
  );
};

export default DeleteSquareIcon;
