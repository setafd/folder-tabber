export function validateCss(css: string) {
  if (css.length > 65_536) throw new Error('Styles exceed 64 KB');
  let plain = '';
  let quote = '';
  for (let index = 0; index < css.length; index++) {
    const character = css[index];
    if (character === '\\') {
      plain += character;
      if (index + 1 < css.length) plain += css[++index];
    } else if (quote) {
      plain += character;
      if (character === quote) quote = '';
    } else if (character === '"' || character === '\'') {
      quote = character;
      plain += character;
    } else if (character === '/' && css[index + 1] === '*') {
      const end = css.indexOf('*/', index + 2);
      if (end < 0) break;
      index = end + 1;
    } else plain += character;
  }
  const decoded = plain.replace(
    /\\([0-9a-f]{1,6})(?:\r\n|[ \t\r\n\f])?|\\([^\n\r\f])/gi,
    (_match, hex: string | undefined, character: string | undefined) =>
      hex ? String.fromCodePoint(Math.min(parseInt(hex, 16), 0x10ffff)) : (character ?? ''),
  );
  if (
    /@(?:import|font-face|namespace|document)\b|\b(?:url|src|image-set|expression|paint)\s*\(|-moz-binding|behavior\s*:/i.test(
      decoded,
    )
  )
    throw new Error('Styles cannot load resources or executable content');
  return css;
}

export const baseStyles = `
:host { display: block; color: var(--text-color, var(--foreground-color, #262626)); background: var(--page-background, transparent); font: inherit; --control-radius: 7px; --page-gap: 18px; }
*, *::before, *::after { box-sizing: border-box; }
* { scrollbar-width: thin; scrollbar-color: var(--scrollbar-thumb, #9aa1ab) transparent; }
.ft-stack { display: flex; flex-direction: column; gap: var(--gap, var(--page-gap)); }
.ft-grid { display: grid; grid-template-columns: repeat(var(--columns, 2), minmax(0, 1fr)); gap: var(--gap, var(--page-gap)); }
.ft-text { margin: 0; line-height: 1.6; overflow-wrap: anywhere; white-space: pre-wrap; }
h2.ft-text { font-size: 18px; font-weight: 600; }
[data-tone='muted'], .ft-label { color: var(--foreground-light-color, #666); }
.ft-metric, .ft-status { padding: 20px; background: var(--surface-color, #fafafa); border: 1px solid var(--border-color, #ddd); border-radius: var(--control-radius); display: flex; flex-direction: column; gap: 9px; }
.ft-label { font-size: 13px; }
.ft-value { font-size: 26px; font-weight: 600; overflow-wrap: anywhere; }
[data-tone='success'] .ft-value { color: var(--success-color, #278454); } [data-tone='warning'] .ft-value { color: var(--warning-color, #ac7516); } [data-tone='danger'] .ft-value { color: var(--danger-color, #c94242); }
.ft-table-wrap { overflow: auto; border: 1px solid var(--border-color, #ddd); border-radius: var(--control-radius); }
.ft-table { width: 100%; min-width: 560px; border-collapse: collapse; font-size: 14px; text-align: left; }
.ft-table th { font-size: 12px; font-weight: 600; color: var(--foreground-light-color, #666); background: var(--surface-color, #fafafa); }
.ft-table th, .ft-table td { min-width: 110px; padding: 13px 16px; border-bottom: 1px solid var(--border-color, #ddd); overflow-wrap: anywhere; max-width: 500px; }
.ft-table tr:last-child td { border-bottom: 0; }
.ft-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.ft-button { display: inline-flex; justify-content: center; align-items: center; min-height: 36px; padding: 7px 13px; border: 1px solid var(--border-color, #ddd); border-radius: var(--control-radius); color: inherit; background: var(--surface-color, #fafafa); font: inherit; font-size: 13px; cursor: pointer; }
.ft-button:hover:enabled { border-color: var(--accent-color, #1971c2); }
.ft-button:disabled { opacity: .5; cursor: default; }
.ft-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
.ft-list__item { padding: 16px; border: 1px solid var(--border-color, #ddd); border-radius: var(--control-radius); }
.ft-list__description { color: var(--foreground-light-color, #666); font-size: 13px; margin: 7px 0; }
.ft-form { display: flex; flex-direction: column; gap: 14px; padding: 18px; border: 1px solid var(--border-color, #ddd); border-radius: var(--control-radius); }
.ft-form__field { display: flex; flex-direction: column; gap: 7px; font-size: 13px; }
.ft-form__checkbox { flex-direction: row; align-items: center; }
.ft-dialog { width: min(480px, calc(100% - 32px)); max-height: calc(100dvh - 32px); padding: 20px; margin: auto; border: 1px solid var(--border-color, #ddd); border-radius: 13px; color: inherit; background: var(--surface-color, #fafafa); box-shadow: var(--workspace-shadow); }
.ft-dialog::backdrop { background: rgb(0 0 0 / 42%); }
.ft-dialog__title { margin: 0 0 16px; font-size: 18px; }
.ft-dialog .ft-form { padding: 0; border: 0; }
.ft-form__actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
.ft-form__actions button[type='submit'] { color: var(--accent-foreground-color); background: var(--accent-color); border-color: transparent; }
.ft-input { width: 100%; padding: 9px 11px; min-height: 36px; border: 1px solid var(--border-color, #ddd); border-radius: var(--control-radius); background: var(--background-color, white); color: inherit; font: inherit; }
.ft-select { position: relative; min-width: 0; }
.ft-select select { appearance: none; padding-inline-end: 40px; }
.ft-select::after { content: ''; pointer-events: none; position: absolute; inset-inline-end: 15px; top: 50%; width: 7px; height: 7px; margin-top: -5px; border-inline-end: 1.5px solid currentColor; border-bottom: 1.5px solid currentColor; transform: rotate(45deg); opacity: .7; }
.ft-select:has(select:disabled)::after { opacity: .35; }
.ft-button, .ft-input { transition: border-color 140ms ease, background-color 140ms ease, opacity 140ms ease; }
@media (prefers-reduced-motion: reduce) { .ft-button, .ft-input { transition: none; } }
textarea.ft-input { resize: vertical; min-height: 90px; }
.ft-error { color: var(--danger-color, #c94242); font-size: 13px; }
.ft-link { color: var(--accent-color, #1971c2); overflow-wrap: anywhere; }
:focus-visible { outline: 2px solid var(--accent-color, #1971c2); outline-offset: 3px; }
@media (max-width: 700px) { .ft-grid { grid-template-columns: 1fr; } }
`;
