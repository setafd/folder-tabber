export const getFaviconUrl = (url: string) => {
  const faviconUrl = new URL(chrome.runtime.getURL('/_favicon/'));
  faviconUrl.searchParams.set('pageUrl', url);
  faviconUrl.searchParams.set('size', '16');

  return faviconUrl.toString();
};
