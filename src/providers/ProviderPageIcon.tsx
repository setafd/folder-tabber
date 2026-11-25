import jiraUrl from './jira.svg';
import type { Manifest } from './protocol';

type IconName = NonNullable<Manifest['pages'][number]['icon']>;

const paths: Record<Exclude<IconName, 'jira'>, string> = {
  activity: 'M3 12h4l3-7 4 14 3-7h4',
  chart: 'M4 4v16h16M8 16v-4m4 4V8m4 8v-6',
  list: 'm4 7 1 1 2-2m-3 6 1 1 2-2m-3 6 1 1 2-2m3-9h10m-10 5h10m-10 5h10',
  page: 'M7 3h7l4 4v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm7 0v5h4M9 12h5m-5 4h5',
};

export function ProviderPageIcon({ name = 'page' }: { name?: IconName }) {
  if (name === 'jira') return <img className="workspace-page-icon" src={jiraUrl} alt="" />;

  return (
    <svg
      className="workspace-page-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
