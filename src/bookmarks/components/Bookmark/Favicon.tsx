import { useSyncExternalStore } from 'react';

import { platform } from '@/platform';

export const Favicon = ({ url }: { url: string }) => {
  const src = useSyncExternalStore(platform.favicons.subscribe, () => platform.favicons.getUrl(url));
  return (
    <img
      src={src}
      alt=""
      width={16}
      height={16}
      loading="lazy"
      onError={(event) => {
        if (event.currentTarget.getAttribute('src') !== platform.favicons.fallback)
          event.currentTarget.src = platform.favicons.fallback;
      }}
    />
  );
};
