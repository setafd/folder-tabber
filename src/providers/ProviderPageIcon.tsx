import { useEffect, useState } from 'react';

import { loadProviderIcon } from './icon-cache';
import { type Source, readToken } from './store';

export function ProviderPageIcon({ source, path }: { source: Source; path: string }) {
  const [url, setUrl] = useState<string | null>();

  useEffect(() => {
    const controller = new AbortController();
    const reader = new FileReader();
    const hideIcon = () => {
      if (!controller.signal.aborted) setUrl(null);
    };
    reader.onerror = hideIcon;
    reader.onload = () => {
      if (!controller.signal.aborted && typeof reader.result === 'string') setUrl(reader.result);
    };
    void loadProviderIcon(source, path, controller.signal, () => readToken(source))
      .then((image) => {
        if (!controller.signal.aborted) reader.readAsDataURL(image);
      })
      .catch(hideIcon);

    return () => {
      controller.abort();
      if (reader.readyState === FileReader.LOADING) reader.abort();
    };
  }, [source, path]);

  if (url === undefined) return <span className="workspace-page-icon" aria-hidden="true" />;
  return url ? <img className="workspace-page-icon" src={url} alt="" onError={() => setUrl(null)} /> : null;
}
