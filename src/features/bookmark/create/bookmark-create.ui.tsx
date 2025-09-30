import { Button, Group, SegmentedControl, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { ContextModalProps } from '@mantine/modals';

import { urlRegex } from '@shared/shared-values';

import { useCreateBookmark } from './bookmark-create.lib';

type ModalProps = {
  parentId?: string;
  option?: 'Bookmark' | 'Folder';
};

const options = ['Bookmark', 'Folder'];

export const BookmarkCreateModal = ({ context, id, innerProps }: ContextModalProps<ModalProps>) => {
  const { parentId, option = 'Bookmark' } = innerProps;

  const form = useForm({
    initialValues: {
      title: '',
      url: '',
      parentId: parentId ?? '',
      option,
    },
    validate: {
      title: (value) => (value.length > 0 ? null : 'Title is required'),
      url: (value, values) => (urlRegex.test(value) || values.option === 'Folder' ? null : 'Invalid URL'),
    },
  });

  const { createNewBookmark } = useCreateBookmark();

  const onSubmit: Parameters<typeof form.onSubmit>[0] = async (values) => {
    let operation;
    if (values.option === 'Bookmark') {
      operation = createNewBookmark({ index: 0, parentId: values.parentId, title: values.title, url: values.url });
    } else {
      operation = createNewBookmark({ index: 0, parentId: values.parentId, title: values.title });
    }

    await operation.then(() => {
      context.closeModal(id);
    });
  };

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack gap={24}>
        <SegmentedControl data={options} key={form.key('option')} {...form.getInputProps('option')} />
        <TextInput
          label="Title"
          placeholder="Enter title"
          withAsterisk
          key={form.key('title')}
          {...form.getInputProps('title')}
        />
        {form.values.option === 'Bookmark' && (
          <TextInput
            label="URL"
            placeholder="Enter URL"
            withAsterisk
            key={form.key('url')}
            {...form.getInputProps('url')}
          />
        )}
        <Group justify="flex-end">
          <Button variant="default" type="reset" onClick={() => context.closeModal(id)}>
            Cancel
          </Button>
          <Button type="submit">Create</Button>
        </Group>
      </Stack>
    </form>
  );
};
