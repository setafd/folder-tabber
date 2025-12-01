import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

import { useDeleteBookmark } from '@features/bookmark/delete';

import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { Modal } from '@shared/ui/Modal';

import { useUpdateBookmark } from './bookmark-edit.lib';
import { useEditBookmarkState } from './bookmark-edit.model';

import styles from './bookmark-edit.module.scss';

type FormProps = {
  id: string;
  title: string;
  url?: string;
  option: 'bookmark' | 'folder';
  onClose: () => void;
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

export const BookmarkUpdateModal = () => {
  const { open, id, title, url, option, onClose } = useEditBookmarkState();

  return (
    <Modal open={open} onClose={onClose} title={option === 'bookmark' ? 'Update bookmark' : 'Update folder'}>
      <BookmarkUpdateForm id={id!} title={title!} url={url} option={option!} onClose={onClose} />
    </Modal>
  );
};

export const BookmarkUpdateForm = (props: FormProps) => {
  const { id: bookmarkId, title, url = '', option, onClose } = props;

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
      onClose()
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
              onDeleteBookmark(bookmarkId).then(onClose);
            } else {
              onDeleteBookmark(bookmarkId, true).then(onClose);
            }
          }}
        >
          Delete
        </Button>
        <div className={styles.footerMainActions}>
          <Button variant="default" type="reset" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Update</Button>
        </div>
      </div>
    </form>
  );
};
