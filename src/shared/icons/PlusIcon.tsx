interface IconProps extends React.ComponentPropsWithoutRef<'svg'> {
  size?: number | string;
}

export const PlusIcon: React.FC<IconProps> = ({ size, style, ...others }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: size, height: size, ...style }}
      {...others}
    >
      <rect x="45" y="20" width="10" height="60" fill="currentColor" />
      <rect x="20" y="45" width="60" height="10" fill="currentColor" />
    </svg>
  );
};
