import { ContextModalProps } from '@mantine/modals';

import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

import { useDeleteBookmark } from '@features/bookmark/delete';

import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';

import { useUpdateBookmark } from './bookmark-edit.lib';

import styles from './bookmark-edit.module.scss';

type ModalProps = {
  id: string;
  title: string;
  url?: string;
  option: 'bookmark' | 'folder';
  onFinish?: () => Promise<void>;
  onCancel?: () => Promise<void>;
};

const schema = z
  .object({
    id: z.string(),
    title: z.string().nonempty('Title is required'),
    url: z.any(),
    option: z.enum(['folder']),
  })
  .or(
    z.object({
      id: z.string(),
      title: z.string().nonempty('Title is required'),
      url: z.string().nonempty().url('Invalid URL'),
      option: z.enum(['bookmark']),
    }),
  );

export const BookmarkUpdateModal = ({ innerProps }: ContextModalProps<ModalProps>) => {
  const { id: bookmarkId, title, url = '', option, onCancel, onFinish } = innerProps;

  const { onDeleteBookmark } = useDeleteBookmark();

  const { register, handleSubmit } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      id: bookmarkId,
      title,
      url,
      option,
    },
  });

  const { updateBookmark } = useUpdateBookmark();

  const onSubmit: SubmitHandler<z.infer<typeof schema>> = async (values) => {
    let operation;
    if (values.option === 'bookmark') {
      operation = updateBookmark(values.id, { title: values.title, url: values.url });
    } else {
      operation = updateBookmark(values.id, { title: values.title });
    }

    await operation.then(() => {
      onFinish?.();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.formItem}>
        <label htmlFor="title">Title</label>
        <Input id="title" placeholder="Enter title" required {...register('title')} />
      </div>
      {option === 'bookmark' && (
        <div className={styles.formItem}>
          <label htmlFor="url">URL</label>
          <Input id="url" placeholder="Enter URL" required {...register('url')} />
        </div>
      )}
      <div className={styles.footer}>
        <Button
          style={{ justifySelf: 'flex-start' }}
          variant="danger"
          onClick={() => {
            if (option === 'bookmark') {
              onDeleteBookmark(bookmarkId).then(() => onFinish?.());
            } else {
              onDeleteBookmark(bookmarkId, true).then(() => onFinish?.());
            }
          }}
        >
          Delete
        </Button>
        <div className={styles.footerMainActions}>
          <Button variant="default" type="reset" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Update</Button>
        </div>
      </div>
    </form>
  );
};
