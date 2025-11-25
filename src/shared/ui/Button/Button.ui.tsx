import { forwardRef } from 'react';

import styles from './Button.module.scss';

interface ButtonProps extends React.ComponentProps<'button'> {
  variant?: 'default' | 'primary' | 'icon' | 'unstyled' | 'danger';
}

const ButtonWrapper = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', ...props },
  ref,
) {
  return <button className={`${className ?? ''} ${styles[variant]} ${styles.button}`} ref={ref} {...props} />;
});

export default ButtonWrapper;
