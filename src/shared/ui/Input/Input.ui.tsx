import { forwardRef } from 'react';

import styles from './Input.module.scss';

const InputWrapper = forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(function Input(
  { className, ...props },
  ref,
) {
  return <input className={`${styles.input} ${className}`} ref={ref} {...props} />;
});

export default InputWrapper;
