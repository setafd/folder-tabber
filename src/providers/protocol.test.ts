import { describe, expect, it } from 'vitest';

import { normalizeAddress, permissionPattern } from './address';
import { checkTreeLimits, manifestSchema, pageSchema } from './protocol';
import { validateCss } from './styles';

const page = (content: unknown) => ({ id: 'tasks', title: 'Tasks', content });
describe('provider boundary', () => {
  it('accepts nested components and rejects unsupported protocol versions', () => {
    expect(
      pageSchema.parse(
        page({ id: 'root', type: 'grid', children: [{ id: 'title', type: 'text', text: '<script>test</script>' }] }),
      ).refreshAfterSeconds,
    ).toBe(60);
    expect(manifestSchema.safeParse({ protocolVersion: 2, name: 'Source', pages: [] }).success).toBe(false);
    expect(pageSchema.safeParse(page({ id: 'root', type: 'script', code: 'alert(1)' })).success).toBe(false);
  });
  it('rejects duplicate IDs, executable URLs, and forms without an action', () => {
    expect(
      pageSchema.safeParse(
        page({ id: 'root', type: 'stack', children: [{ id: 'root', type: 'text', text: 'duplicate' }] }),
      ).success,
    ).toBe(false);
    expect(
      pageSchema.safeParse(page({ id: 'link', type: 'link', label: 'Open', url: 'javascript:alert(1)' })).success,
    ).toBe(false);
    expect(
      pageSchema.safeParse(page({ id: 'form', type: 'form', mode: 'action', fields: [], submitLabel: 'Submit' }))
        .success,
    ).toBe(false);
  });
  it('keeps recognized page icons and falls back for missing or unsupported icons', () => {
    const manifest = manifestSchema.parse({
      protocolVersion: 1,
      name: 'Workspace',
      pages: [
        { id: 'health', title: 'Service Health', icon: 'activity' },
        { id: 'jira', title: 'Jira Queue', icon: 'jira' },
        { id: 'notes', title: 'Notes' },
        { id: 'future', title: 'Future Dashboard', icon: 'new-icon' },
        { id: 'external', title: 'External Dashboard', icon: 'https://example.com/icon.svg' },
      ],
    });
    expect(manifest.pages.map((entry) => entry.icon)).toEqual(['activity', 'jira', undefined, undefined, undefined]);
  });
  it('bounds input complexity before recursive schema parsing', () => {
    let nested: unknown = null;
    for (let i = 0; i < 45; i++) nested = { child: nested };
    expect(() => checkTreeLimits(nested)).toThrow('complex');
    expect(() => checkTreeLimits(Array(20_001).fill(0))).toThrow('complex');
  });
  it('normalizes endpoint prefixes and permits HTTP only on loopback', () => {
    expect(normalizeAddress('https://example.com/provider')).toBe('https://example.com/provider/');
    expect(permissionPattern('http://127.0.0.1:4318/')).toBe('http://127.0.0.1/*');
    for (const address of [
      'http://example.com/',
      'https://user:secret@example.com/',
      'https://example.com/?token=x',
      'file:///tmp/page',
    ])
      expect(() => normalizeAddress(address)).toThrow();
  });
  it('allows styling but rejects resource loads, including escaped CSS', () => {
    expect(validateCss(':host { --accent-color: red; } .ft-table { color: var(--accent-color); }')).toContain('red');
    for (const css of [
      '@import "https://evil.test/style";',
      'a { background: url(https://evil.test); }',
      'a { background: u\\72l(https://evil.test); }',
      '@\\69mport "x";',
      'a { background: u/**/rl(x); }',
      'a { background: image-set("x" 1x); }',
    ])
      expect(() => validateCss(css)).toThrow();
  });
});

it('does not treat comment markers inside CSS strings as real comments', () => {
  expect(() => validateCss('.x { --before: "/*"; background: url(https://example.com); --after: "*/"; }')).toThrow();
  expect(validateCss('.x { content: "/* text */"; color: red; }')).toContain('color: red');
});

it('handles CSS hexadecimal escapes followed by CRLF', () => {
  expect(() =>
    validateCss('.x { background: u' + String.fromCharCode(92) + '72\r\nl(https://example.com); }'),
  ).toThrow();
});
