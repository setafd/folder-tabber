import { useEffect, useRef } from 'react';

import { CheckIcon } from '@shared/icons';
import { Button } from '@shared/ui/Button';

import { useRenameFolder } from './folder-edit.lib';

import styles from './folder-edit.module.scss';

type FolderEditItemProps = {
  id: string;
  title: string;
  children: (event: () => void) => React.ReactNode;
};

export const FolderEditItemWrapper: React.FC<FolderEditItemProps> = ({ id, title, children }) => {
  const ref = useRef<HTMLFormElement>(null);
  const { showInput, isInput, onSubmit, register, onKeyDown, hideInput } = useRenameFolder(id, title);

  useEffect(() => {
    const form = ref.current;
    const listener = (event: FocusEvent) => {
      if (form?.contains(event.relatedTarget as Node)) return;
      hideInput();
    };

    if (form) {
      form.addEventListener('focusout', listener);
    }
    return () => form?.removeEventListener('focusout', listener);
  }, [hideInput]);

  return (
    <>
      {isInput ? (
        <form ref={ref} className={styles.createInputContainer} onSubmit={onSubmit}>
          <input autoFocus className={styles.createInput} onKeyDown={onKeyDown} {...register('title')} />
          <Button variant="icon" type="submit" className={styles.submitButton}>
            <CheckIcon size={20} />
          </Button>
        </form>
      ) : (
        children(showInput)
      )}
    </>
  );
};
