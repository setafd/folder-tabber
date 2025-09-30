interface AddBookmarkIconProps extends React.ComponentPropsWithoutRef<'svg'> {
  size?: number | string;
}

const AddBookmarkIcon: React.FC<AddBookmarkIconProps> = ({ size, style, ...others }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      style={{ width: size, height: size, ...style }}
      {...others}
    >
      <path
        d="M20 8h24a4 4 0 0 1 4 4v44l-16-8-16 8V12a4 4 0 0 1 4-4z"
        fill="#fde047"
        stroke="#000"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      <g stroke="#000" strokeWidth="2" strokeLinecap="round">
        <line x1="32" y1="24" x2="32" y2="36" />
        <line x1="26" y1="30" x2="38" y2="30" />
      </g>
    </svg>
  );
};

export default AddBookmarkIcon;
