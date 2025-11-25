import { useEffect, useRef } from 'react';

import { CheckIcon, PlusIcon } from '@shared/icons';
import { Button } from '@shared/ui/Button';

import { useCreateFolder } from './folder-create.lib';

import styles from './folder-create.module.scss';

type FolderCreateItemProps = {
  parentId: string;
  buttonClassName?: string;
};

export const FolderCreateItem = ({ buttonClassName, parentId }: FolderCreateItemProps) => {
  const ref = useRef<HTMLFormElement>(null);
  const { showInput, isInput, onSubmit, register, onKeyDown, hideInput } = useCreateFolder(parentId);

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

  return isInput ? (
    <form ref={ref} className={styles.createInputContainer} onSubmit={onSubmit}>
      <input
        autoFocus
        className={styles.createInput}
        onKeyDown={onKeyDown}
        {...register('title')}
      />
      <Button variant="icon" type="submit" className={styles.submitButton}>
        <CheckIcon size={20} />
      </Button>
    </form>
  ) : (
    <Button variant="unstyled" onClick={showInput} className={`${buttonClassName} ${styles.createButton}`}>
      <PlusIcon size={16} /> Create folder
    </Button>
  );
};
