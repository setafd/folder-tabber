interface IconProps extends React.ComponentPropsWithoutRef<'svg'> {
  size?: number | string;
}

const EditIcon: React.FC<IconProps> = ({ size, style, ...others }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ width: size, height: size, ...style }}
      {...others}
    >
      <path d="M44 8l12 12-28 28H16V36L44 8z" fill="currentColor" stroke="black" strokeLinejoin="round" />

      <path d="M16 36l8 8" stroke="black" strokeLinecap="round" />
      <path d="M44 8l-6 6 12 12 6-6-12-12z" fill="currentColor" stroke="black" />

      <polygon points="14,42 20,48 16,50 12,46" fill="black" stroke="black" strokeWidth="1" />
    </svg>
  );
};

export default EditIcon;
