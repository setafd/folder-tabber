import { z } from 'zod';

import { dataTypes } from './data-types';

export type Value = string | number | boolean | null;
export type Action = { id: string; label: string; input: Record<string, Value>; confirm?: string };
export type Field = {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox';
  value?: Value;
  required: boolean;
  options: { label: string; value: string }[];
};
type Base = { id: string };
export type ViewNode = Base &
  (
    | { type: 'stack' | 'grid'; children: ViewNode[]; columns?: number; gap?: 'small' | 'medium' | 'large' }
    | { type: 'text'; text: string; tone?: 'default' | 'muted'; heading?: boolean }
    | { type: 'metric' | 'status'; label: string; value: Value; tone?: 'default' | 'success' | 'warning' | 'danger' }
    | { type: 'link'; label: string; url: string }
    | { type: 'list'; items: { id: string; text: string; description?: string; actions: Action[] }[] }
    | {
        type: 'table';
        columns: { field: string; title: string }[];
        rows: { id: string; values: Record<string, Value>; actions: Action[] }[];
      }
    | { type: 'button'; action: Action }
    | { type: 'form'; mode: 'query' | 'action'; fields: Field[]; submitLabel: string; action?: Action }
  );

const identifier = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/);
const text = z.string().max(20_000);
const value = z.union([text, z.number().finite(), z.boolean(), z.null()]);
const values = z.record(identifier, value);
const unique = (items: { id: string }[]) => new Set(items.map((item) => item.id)).size === items.length;
const actionSchema = z
  .object({
    id: identifier,
    label: z.string().min(1).max(200),
    input: values.default({}),
    confirm: z.string().max(1000).optional(),
  })
  .strict();
const fieldSchema = z
  .object({
    name: identifier,
    label: z.string().min(1).max(200),
    type: z.enum(['text', 'textarea', 'select', 'checkbox']),
    value: value.optional(),
    required: z.boolean().default(false),
    options: z
      .array(z.object({ label: text, value: z.string().max(1000) }).strict())
      .max(200)
      .default([]),
  })
  .strict();
const base = z.object({ id: identifier });
const children = () => z.array(nodeSchema).max(200);
const nodeSchema: z.ZodType<ViewNode> = z.lazy(() =>
  z.discriminatedUnion('type', [
    base
      .extend({ type: z.literal('stack'), children: children(), gap: z.enum(['small', 'medium', 'large']).optional() })
      .strict(),
    base
      .extend({
        type: z.literal('grid'),
        children: children(),
        columns: z.number().int().min(1).max(6).optional(),
        gap: z.enum(['small', 'medium', 'large']).optional(),
      })
      .strict(),
    base
      .extend({
        type: z.literal('text'),
        text,
        tone: z.enum(['default', 'muted']).optional(),
        heading: z.boolean().optional(),
      })
      .strict(),
    base
      .extend({
        type: z.literal('metric'),
        label: text,
        value,
        tone: z.enum(['default', 'success', 'warning', 'danger']).optional(),
      })
      .strict(),
    base
      .extend({
        type: z.literal('status'),
        label: text,
        value,
        tone: z.enum(['default', 'success', 'warning', 'danger']).optional(),
      })
      .strict(),
    base
      .extend({ type: z.literal('link'), label: text, url: z.url().refine((url) => /^https?:\/\//i.test(url)) })
      .strict(),
    base
      .extend({
        type: z.literal('list'),
        items: z
          .array(
            z
              .object({
                id: identifier,
                text,
                description: text.optional(),
                actions: z.array(actionSchema).max(20).default([]),
              })
              .strict(),
          )
          .max(500)
          .refine(unique),
      })
      .strict(),
    base
      .extend({
        type: z.literal('table'),
        columns: z
          .array(z.object({ field: identifier, title: text }).strict())
          .min(1)
          .max(30),
        rows: z
          .array(z.object({ id: identifier, values, actions: z.array(actionSchema).max(20).default([]) }).strict())
          .max(500)
          .refine(unique),
      })
      .strict(),
    base.extend({ type: z.literal('button'), action: actionSchema }).strict(),
    base
      .extend({
        type: z.literal('form'),
        mode: z.enum(['query', 'action']),
        fields: z.array(fieldSchema).max(50),
        submitLabel: z.string().min(1).max(200),
        action: actionSchema.optional(),
      })
      .strict(),
  ]),
);

export const manifestSchema = z
  .object({
    protocolVersion: z.literal(1),
    dataTypes: z.array(z.enum(dataTypes)).max(dataTypes.length).default(['authenticationInfo', 'websiteContent']),
    name: z.string().min(1).max(100),
    pages: z
      .array(z.object({ id: identifier, title: z.string().min(1).max(200) }).strict())
      .max(100)
      .refine(unique),
  })
  .strict();
export const pageSchema = z
  .object({
    id: identifier,
    title: z.string().min(1).max(200),
    refreshAfterSeconds: z.number().int().min(10).max(3600).default(60),
    css: z.string().max(65_536).default(''),
    content: nodeSchema,
  })
  .strict()
  .superRefine((page, context) => {
    const ids = new Set<string>();
    const visit = (node: ViewNode) => {
      if (ids.has(node.id)) context.addIssue({ code: 'custom', message: 'Component IDs must be unique' });
      ids.add(node.id);
      if (node.type === 'grid' || node.type === 'stack') node.children.forEach(visit);
      if (node.type === 'form') {
        if (node.mode === 'action' && !node.action)
          context.addIssue({ code: 'custom', message: 'Action forms need an action' });
        if (new Set(node.fields.map((field) => field.name)).size !== node.fields.length)
          context.addIssue({ code: 'custom', message: 'Field names must be unique' });
      }
    };
    visit(page.content);
  });
export const actionResultSchema = z.discriminatedUnion('status', [
  z
    .object({ status: z.literal('success'), message: z.string().max(1000), refresh: z.boolean().default(true) })
    .strict(),
  z
    .object({
      status: z.literal('error'),
      message: z.string().max(1000),
      fieldErrors: z.record(identifier, z.string().max(1000)).default({}),
    })
    .strict(),
]);
export type Manifest = z.infer<typeof manifestSchema>;
export type ProviderPage = z.infer<typeof pageSchema>;
export type ActionResult = z.infer<typeof actionResultSchema>;

export function checkTreeLimits(input: unknown) {
  let count = 0;
  const visit = (item: unknown, depth: number) => {
    if (++count > 20_000 || depth > 40) throw new Error('Provider response is too complex');
    if (item && typeof item === 'object') Object.values(item).forEach((child) => visit(child, depth + 1));
  };
  visit(input, 0);
}
