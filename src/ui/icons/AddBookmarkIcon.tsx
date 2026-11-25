interface AddBookmarkIconProps extends React.ComponentPropsWithoutRef<'svg'> {
  size?: number | string;
}

const AddBookmarkIcon: React.FC<AddBookmarkIconProps> = ({ size, style, ...others }) => {
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
      <path d="M18 21l-6-4-6 4V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2zM12 7v6m-3-3h6" />
    </svg>
  );
};

export default AddBookmarkIcon;
