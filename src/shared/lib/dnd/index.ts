const CONTAINER_PREFIX = 'container:';

export const toContainerId = (id: string) => `${CONTAINER_PREFIX}${id}`;

export const fromContainerId = (id: string): string | null =>
  id.startsWith(CONTAINER_PREFIX) ? id.slice(CONTAINER_PREFIX.length) : null;
