import ModalBase, { type ModalProps } from 'react-responsive-modal';

import styles from './Modal.module.scss';

interface ModalPropsExtended extends ModalProps {
  title?: string;
}

export const Modal: React.FC<ModalPropsExtended> = ({ title, children, ...props }) => {
  return (
    <ModalBase classNames={{ modal: styles.modal }} ariaLabelledby="modal-title" {...props}>
      {title && (
        <h2 id="modal-title" className={styles.title}>
          {title}
        </h2>
      )}
      <div className={styles.modalContent}>{children}</div>
    </ModalBase>
  );
};
