import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { Modal } from '@shared/ui/Modal';

import { useCreateBookmark } from './bookmark-create.lib';
import { useCreateBookmarkState } from './bookmark-create.model';

import styles from './bookmark-create.module.scss';

const schema = z
  .object({
    title: z.string().nonempty('Title is required'),
    url: z.any(),
    option: z.enum(['folder']),
    parentId: z.string().optional(),
  })
  .or(
    z.object({
      title: z.string().nonempty('Title is required'),
      url: z.string().nonempty().url('Invalid URL'),
      option: z.enum(['bookmark']),
      parentId: z.string().optional(),
    }),
  );

export const BookmarkCreateFormModal = () => {
  const { open, parentId, option, onClose } = useCreateBookmarkState();

  return (
    <Modal open={open} onClose={onClose} title={option === 'bookmark' ? 'Create bookmark' : 'Create folder'}>
      <BookmarkCreateForm parentId={parentId} option={option} onClose={onClose} />
    </Modal>
  );
};

const BookmarkCreateForm = ({
  parentId,
  option,
  onClose,
}: {
  parentId?: string;
  option?: 'bookmark' | 'folder';
  onClose: () => void;
}) => {
  const { register, handleSubmit, watch } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      url: '',
      parentId: parentId ?? '',
      option,
    },
  });

  const { createNewBookmark } = useCreateBookmark();

  const onSubmit: SubmitHandler<z.infer<typeof schema>> = async (values) => {
    let operation;
    if (values.option === 'bookmark') {
      operation = createNewBookmark({ index: 0, parentId: values.parentId, title: values.title, url: values.url });
    } else {
      operation = createNewBookmark({ index: 0, parentId: values.parentId, title: values.title });
    }

    await operation.then(() => {
      onClose();
    });
  };

  const optionValue = watch('option');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.radioContainer}>
        <label htmlFor="option-folder" className={styles.radioLabel}>
          <input className={styles.radioInput} {...register('option')} type="radio" value="folder" id="option-folder" />
          Folder
        </label>
        <label htmlFor="option-bookmark" className={styles.radioLabel}>
          <input
            className={styles.radioInput}
            {...register('option')}
            type="radio"
            value="bookmark"
            id="option-bookmark"
          />
          Bookmark
        </label>
      </div>
      <div className={styles.formItem}>
        <label htmlFor="title">Title</label>
        <Input id="title" placeholder="Enter title" required {...register('title')} />
      </div>
      {optionValue === 'bookmark' && (
        <div className={styles.formItem}>
          <label htmlFor="url">URL</label>
          <Input id="url" placeholder="Enter URL" required {...register('url')} />
        </div>
      )}
      <div className={styles.footer}>
        <Button variant="default" type="reset" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Create</Button>
      </div>
    </form>
  );
};
