import { ContextModalProps } from '@mantine/modals';

import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';

import { useCreateBookmark } from './bookmark-create.lib';

import styles from './bookmark-create.module.scss';

type FormProps = {
  parentId?: string;
  option?: 'bookmark' | 'folder';
  onFinish?: () => Promise<void>;
  onCancel?: () => Promise<void>;
};

const schema = z
  .object({
    title: z.string().nonempty('Title is required'),
    url: z.any(),
    parentId: z.string().optional(),
    option: z.enum(['folder']),
  })
  .or(
    z.object({
      title: z.string().nonempty('Title is required'),
      url: z.string().nonempty().url('Invalid URL'),
      option: z.enum(['bookmark']),
      parentId: z.string().optional(),
    }),
  );

export const BookmarkCreateForm = ({ innerProps }: ContextModalProps<FormProps>) => {
  const { parentId, option = 'bookmark', onFinish, onCancel } = innerProps;

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
      onFinish?.();
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
        <Button variant="default" type="reset" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create</Button>
      </div>
    </form>
  );
};
