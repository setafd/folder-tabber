import { useLayoutEffect, useRef, useState } from 'react';

import { createPortal } from 'react-dom';

import type { Action, ActionResult, Field, ProviderPage, Value, ViewNode } from './protocol';
import { baseStyles, validateCss } from './styles';

type Context = {
  disabled: boolean;
  onAction: (action: Action, input?: Record<string, Value>) => Promise<ActionResult | null>;
  onQuery: (input: Record<string, Value>) => void;
};
const display = (value: Value | undefined) => (value === null || value === undefined ? '—' : String(value));

function ActionButton({ action, context }: { action: Action; context: Context }) {
  return (
    <button
      type="button"
      className="ft-button"
      data-action-id={action.id}
      disabled={context.disabled}
      onClick={() => {
        if (!action.confirm || window.confirm(action.confirm)) void context.onAction(action);
      }}
    >
      {action.label}
    </button>
  );
}

function Form({ node, context }: { node: Extract<ViewNode, { type: 'form' }>; context: Context }) {
  const [values, setValues] = useState<Record<string, Value>>(() =>
    Object.fromEntries(
      node.fields.map((field) => [field.name, field.value ?? (field.type === 'checkbox' ? false : '')]),
    ),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const getValue = (field: Field) => values[field.name] ?? field.value ?? (field.type === 'checkbox' ? false : '');
  return (
    <form
      data-component-id={node.id}
      className="ft-form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (context.disabled) return;
        setErrors({});
        setMessage('');
        const input = Object.fromEntries(node.fields.map((field) => [field.name, getValue(field)]));
        if (node.mode === 'query') {
          context.onQuery(input);
          return;
        }
        if (!node.action || (node.action.confirm && !window.confirm(node.action.confirm))) return;
        const result = await context.onAction(node.action, input);
        if (result?.status === 'error') {
          setErrors(result.fieldErrors);
          setMessage(result.message);
        }
      }}
    >
      {node.fields.map((field) => {
        const props = {
          id: `${node.id}-${field.name}`,
          name: field.name,
          required: field.required,
          disabled: context.disabled,
          'aria-invalid': !!errors[field.name],
          'aria-describedby': errors[field.name] ? `${node.id}-${field.name}-error` : undefined,
        };
        const change = (value: Value) => {
          setValues((current) => ({ ...current, [field.name]: value }));
          setErrors((current) => ({ ...current, [field.name]: '' }));
        };
        return (
          <div key={field.name} className={`ft-form__field ${field.type === 'checkbox' ? 'ft-form__checkbox' : ''}`}>
            {field.type === 'checkbox' && (
              <input
                {...props}
                type="checkbox"
                checked={getValue(field) === true}
                onChange={(event) => change(event.target.checked)}
              />
            )}
            <label htmlFor={props.id}>
              {field.label}
              {field.required && <span aria-hidden="true"> *</span>}
            </label>
            {field.type === 'text' && (
              <input
                {...props}
                className="ft-input"
                maxLength={20_000}
                value={String(getValue(field))}
                onChange={(event) => change(event.target.value)}
              />
            )}
            {field.type === 'textarea' && (
              <textarea
                {...props}
                className="ft-input"
                maxLength={20_000}
                value={String(getValue(field))}
                onChange={(event) => change(event.target.value)}
              />
            )}
            {field.type === 'select' && (
              <div className="ft-select">
                <select
                  {...props}
                  className="ft-input"
                  value={String(getValue(field))}
                  onChange={(event) => change(event.target.value)}
                >
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {errors[field.name] && (
              <span id={`${node.id}-${field.name}-error`} className="ft-error">
                {errors[field.name]}
              </span>
            )}
          </div>
        );
      })}
      {message && (
        <div role="alert" className="ft-error">
          {message}
        </div>
      )}
      <div>
        <button type="submit" className="ft-button" disabled={context.disabled}>
          {node.submitLabel}
        </button>
      </div>
    </form>
  );
}

function Node({ node, context }: { node: ViewNode; context: Context }) {
  switch (node.type) {
    case 'stack':
    case 'grid':
      return (
        <div
          data-component-id={node.id}
          className={`ft-${node.type}`}
          style={
            {
              '--columns': node.columns ?? 2,
              '--gap': node.gap === 'small' ? '10px' : node.gap === 'large' ? '28px' : '18px',
            } as React.CSSProperties
          }
        >
          {node.children.map((child) => (
            <Node key={child.id} node={child} context={context} />
          ))}
        </div>
      );
    case 'text':
      return node.heading ? (
        <h2 data-component-id={node.id} className="ft-text" data-tone={node.tone}>
          {node.text}
        </h2>
      ) : (
        <p data-component-id={node.id} className="ft-text" data-tone={node.tone}>
          {node.text}
        </p>
      );
    case 'metric':
    case 'status':
      return (
        <div data-component-id={node.id} className={`ft-${node.type}`} data-tone={node.tone}>
          <span className="ft-label">{node.label}</span>
          <strong className="ft-value">{display(node.value)}</strong>
        </div>
      );
    case 'link':
      return (
        <a data-component-id={node.id} className="ft-link" href={node.url} target="_blank" rel="noopener noreferrer">
          {node.label}
        </a>
      );
    case 'button':
      return (
        <div data-component-id={node.id}>
          <ActionButton action={node.action} context={context} />
        </div>
      );
    case 'form':
      return <Form node={node} context={context} />;
    case 'list':
      return (
        <ul data-component-id={node.id} className="ft-list">
          {node.items.map((item) => (
            <li key={item.id} className="ft-list__item">
              <div>{item.text}</div>
              {item.description && <p className="ft-list__description">{item.description}</p>}
              <div className="ft-actions">
                {item.actions.map((action) => (
                  <ActionButton key={action.id} action={action} context={context} />
                ))}
              </div>
            </li>
          ))}
        </ul>
      );
    case 'table':
      return (
        <div data-component-id={node.id} className="ft-table-wrap">
          <table className="ft-table">
            <thead>
              <tr>
                {node.columns.map((column) => (
                  <th key={column.field} scope="col">
                    {column.title}
                  </th>
                ))}
                {node.rows.some((row) => row.actions.length) && <th scope="col">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {node.rows.map((row) => (
                <tr key={row.id} className="ft-table__row">
                  {node.columns.map((column) => (
                    <td key={column.field}>
                      {display(
                        Object.prototype.hasOwnProperty.call(row.values, column.field)
                          ? row.values[column.field]
                          : undefined,
                      )}
                    </td>
                  ))}
                  {node.rows.some((item) => item.actions.length) && (
                    <td>
                      <div className="ft-actions">
                        {row.actions.map((action) => (
                          <ActionButton key={action.id} action={action} context={context} />
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!node.rows.length && (
            <p className="ft-text" style={{ padding: 16 }}>
              No results
            </p>
          )}
        </div>
      );
  }
}

export function Renderer({ page, localCss, ...context }: Context & { page: ProviderPage; localCss: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [root, setRoot] = useState<ShadowRoot | null>(null);
  useLayoutEffect(() => {
    if (host.current) setRoot(host.current.shadowRoot ?? host.current.attachShadow({ mode: 'open' }));
  }, []);
  return (
    <div className="provider-content-boundary">
      <div ref={host} data-provider-content="true">
        {root &&
          createPortal(
            <>
              <style>{baseStyles}</style>
              <style>{validateCss(page.css)}</style>
              <style>{validateCss(localCss)}</style>
              <Node key={page.content.id} node={page.content} context={context} />
            </>,
            root,
          )}
      </div>
    </div>
  );
}
