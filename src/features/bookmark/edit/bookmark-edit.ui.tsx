import { useState } from 'react';

import { Button, Group, Popover, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { ContextModalProps } from '@mantine/modals';

import { useDeleteBookmark } from '@features/bookmark/delete';

import { urlRegex } from '@shared/shared-values';

import { useUpdateBookmark } from './bookmark-edit.lib';

type ModalProps = {
  id: string;
  title: string;
  url?: string;
  option: 'Bookmark' | 'Folder';
};

export const BookmarkUpdateModal = ({ context, id, innerProps }: ContextModalProps<ModalProps>) => {
  const { id: bookmarkId, title, url = '', option } = innerProps;

  const [popoverOpened, setPopoverOpened] = useState(false);

  const { onDeleteBookmark } = useDeleteBookmark();

  const form = useForm({
    initialValues: {
      id: bookmarkId,
      title,
      url,
      option,
    },
    validate: {
      title: (value) => (value.length > 0 ? null : 'Title is required'),
      url: (value, values) => (urlRegex.test(value) || values.option === 'Folder' ? null : 'Invalid URL'),
    },
  });

  const { updateBookmark } = useUpdateBookmark();

  const onSubmit: Parameters<typeof form.onSubmit>[0] = async (values) => {
    let operation;
    if (values.option === 'Bookmark') {
      operation = updateBookmark(values.id, { title: values.title, url: values.url });
    } else {
      operation = updateBookmark(values.id, { title: values.title });
    }

    await operation.then(() => {
      context.closeModal(id);
    });
  };

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack gap={24}>
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
        <Group justify="space-between">
          {option === 'Bookmark' ? (
            <Button
              style={{ justifySelf: 'flex-start' }}
              variant="filled"
              color="red"
              onClick={() => onDeleteBookmark(form.values.id).then(() => context.closeModal(id))}
            >
              Delete
            </Button>
          ) : (
            <Popover opened={popoverOpened} onChange={setPopoverOpened}>
              <Popover.Target>
                <Button
                  style={{ justifySelf: 'flex-start' }}
                  variant="filled"
                  color="red"
                  onClick={() => setPopoverOpened(true)}
                >
                  Delete
                </Button>
              </Popover.Target>
              <Popover.Dropdown w={240}>
                <Text size="sm">Are you sure you want to delete this folder and all its children?</Text>
                <Group mt="xs" justify="flex-end" wrap="nowrap">
                  <Button variant="default" onClick={() => setPopoverOpened(false)}>
                    No
                  </Button>
                  <Button
                    color="red"
                    onClick={() => {
                      setPopoverOpened(false);
                      onDeleteBookmark(form.values.id, true).then(() => {
                        context.closeModal(id);
                      });
                    }}
                  >
                    Yes
                  </Button>
                </Group>
              </Popover.Dropdown>
            </Popover>
          )}
          <Group>
            <Button variant="default" type="reset" onClick={() => context.closeModal(id)}>
              Cancel
            </Button>
            <Button type="submit">Update</Button>
          </Group>
        </Group>
      </Stack>
    </form>
  );
};
