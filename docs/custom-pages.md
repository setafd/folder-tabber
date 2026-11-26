# Custom Pages provider API

FolderTabber connects to a provider over HTTP and renders the JSON returned by its endpoints. A read-only provider needs a manifest and a page endpoint. Add an action endpoint when a page offers commands or submits changes.

## Base URL and HTTP

The source address is a base URL. For `https://example.com/foldertabber/`, discovery requests go to `https://example.com/foldertabber/v1/manifest`. FolderTabber preserves an optional path prefix and adds a trailing slash to the base URL as needed.

| Method | Path relative to the base URL | When called |
| --- | --- | --- |
| GET | `v1/manifest` | The user clicks **Connect** in the source settings |
| GET | `v1/pages/{pageId}` | A page opens, refreshes, or submits a query form |
| POST | `v1/pages/{pageId}/actions` | The user triggers an action on that page |
| GET | The page's `iconPath`, if set | The sidebar loads an icon that has no cached copy |

- Use HTTPS. Plain HTTP is accepted for `localhost`, `127.0.0.1`, and `[::1]`. The base URL accepts a port and a path prefix. URLs with embedded credentials, a query string, or a fragment are rejected.
- The `v1` endpoints receive `Accept: application/json`. When a token is configured, every request also includes `Authorization: Bearer <token>`. Action requests use `Content-Type: application/json`. The client omits cookies and rejects redirects.
- For `v1` endpoints, return a 2xx response with `Content-Type: application/json` and a JSON body matching the endpoint schema. FolderTabber reads up to 1,048,576 JSON response bytes and allows up to 15 seconds per request, including the response body. The JSON is limited to 20,000 values and a nesting depth of 40, counting the root at depth 0.
- Use `401` or `403` for authentication or access failures. Other non-2xx responses appear as HTTP errors. To report an action's validation errors in the form, return the [action error envelope](#action-responses) in a 2xx response.

Schema objects accept the fields listed below. Identifiers and map keys use 1–100 characters, start with an ASCII letter or digit, and can also contain `_`, `-`, and `.` after the first character. Where a value is described as a **scalar**, it accepts a string of up to 20,000 characters, a finite number, a boolean, or `null`.

## Discover pages

`GET v1/manifest` returns one source and its available pages.

| Field | Required | Value |
| --- | --- | --- |
| `protocolVersion` | Yes | The number `1` |
| `name` | Yes | Source label in the sidebar, 1–100 characters |
| `pages` | Yes | Array of up to 100 page entries with unique IDs. An empty array is valid. |
| `dataTypes` | Optional | Firefox data-consent categories. Defaults to `["authenticationInfo", "websiteContent"]`. Use `[]` to declare no categories. |

Each page entry requires an `id` that follows the identifier rules above and a `title` of 1–200 characters. It can also include an optional [`iconPath`](#sidebar-icons).

```json
{
  "protocolVersion": 1,
  "name": "My services",
  "dataTypes": [],
  "pages": [
    { "id": "service-health", "title": "Service Health", "iconPath": "icons/health.svg" }
  ]
}
```

On connection, FolderTabber requests access to the provider's site. Firefox also uses `dataTypes` for the source's data permissions. The supported values are `authenticationInfo`, `bookmarksInfo`, `browsingActivity`, `financialAndPaymentInfo`, `healthInfo`, `locationInfo`, `personalCommunications`, `personallyIdentifyingInfo`, `searchTerms`, `technicalAndInteraction`, `websiteActivity`, and `websiteContent`. The array accepts up to 12 entries. A bearer token requires `authenticationInfo` on Firefox even when it is absent from the array.

### Sidebar icons

Serve the image at `iconPath`, a relative path of up to 1,024 characters within the provider's base URL. For `https://example.com/foldertabber/`, `icons/health.svg` resolves to `https://example.com/foldertabber/icons/health.svg`. Use a relative path with URL-encoded spaces, if needed. Absolute paths, traversal segments, queries, and fragments are rejected.

The icon request uses `GET` and `Accept: image/png, image/webp, image/svg+xml`. Return a 2xx response with the binary image and the corresponding `Content-Type`. The maximum response size is 65,536 bytes. If the icon is omitted, fails to load, or cannot be displayed, the sidebar shows the page title alone.

FolderTabber caches downloaded icons for the saved source revision. Click **Connect** and save the source again to pick up a different path or refresh a file at the same path.

## Return a page

`GET v1/pages/{pageId}` returns the content for that page.

| Field | Required | Value |
| --- | --- | --- |
| `id` | Yes | The page ID from the request and the manifest |
| `title` | Yes | Page title in the content header, 1–200 characters |
| `content` | Yes | One root [component](#components). Use a `stack` or `grid` to group multiple components. |
| `refreshAfterSeconds` | Optional | Integer from 10 to 3,600. Defaults to 60. |
| `css` | Optional | [Page-scoped CSS](#page-css), up to 65,536 characters. Defaults to an empty string. |

`GET v1/pages/service-health` can return a metric as its root component.

```json
{
  "id": "service-health",
  "title": "Service Health",
  "content": {
    "id": "health-summary",
    "type": "metric",
    "label": "Healthy services",
    "value": "3 / 3",
    "tone": "success"
  }
}
```

An open page refreshes at its configured interval while visible and can reload when its tab becomes visible again. The user can also refresh it manually. FolderTabber can show the last successful snapshot if a refresh fails. While results are stale, actions and manual submissions are disabled. Debounced query forms remain editable. An authentication failure during a page read clears the displayed content.

## Components

Every component requires `id` and `type`. Component IDs are unique across the page, including descendants in stacks and grids. Keep IDs stable between refreshes for components that represent the same data or form.

| `type` | Required fields | Optional fields and defaults |
| --- | --- | --- |
| `stack` | `children`, up to 200 components | `gap` is `small`, `medium`, or `large`. Defaults to `medium`. |
| `grid` | `children`, up to 200 components | `columns` is an integer from 1 to 6, default 2. `gap` uses the same values as `stack`. |
| `text` | `text` | `tone` is `default` or `muted`. `heading` is a boolean, default false in the renderer. |
| `metric`, `status` | `label`, scalar `value` | `tone` is `default`, `success`, `warning`, or `danger`. |
| `link` | `label`, absolute HTTP or HTTPS `url` | Opens in a new tab. |
| `list` | `items`, up to 500 [list entries](#lists-and-tables) | |
| `table` | `columns`, 1–30 columns, and `rows`, up to 500 [table rows](#lists-and-tables) | |
| `button` | `action`, an [action descriptor](#action-descriptors) | |
| `form` | `mode`, `fields`. Forms with a submit button require `submitLabel`. Action forms also require `action`. | Query forms can set `debounceMs` for automatic submission. See [forms](#forms). |

Component text, metric and link labels, list text and descriptions, and table column titles are strings of up to 20,000 characters. A null metric, status, or table value displays as a dash.

### Lists and tables

- A list entry requires `id` and `text`. It can include `description` and `actions`. IDs are unique within the list.
- A table column requires `field` and `title`. The `field` is the key used to read the cell from a row's `values` object.
- A table row requires `id` and `values`, an object with scalar values keyed by column field. It can include `actions`. Row IDs are unique within the table. A cell with an absent or null value displays as a dash.
- Each entry or row accepts up to 20 action descriptors. An omitted `actions` array defaults to `[]`.

## Forms

A form requires `mode` (`query` or `action`) and `fields` (up to 50). A visible submit button requires `submitLabel` (1–200 characters). Field names are unique within the form.

| Field property | Required | Value |
| --- | --- | --- |
| `name` | Yes | Identifier used as the query parameter or input key |
| `label` | Yes | Visible label, 1–200 characters |
| `type` | Yes | `text`, `textarea`, `select`, or `checkbox` |
| `value` | Optional | Initial scalar value. A missing or null value starts a checkbox unchecked and other fields with an empty value. |
| `required` | Optional | Boolean, defaults to `false` |
| `options` | Optional | Used by `select`. Defaults to `[]`. Up to 200 entries, each with a string `label` of up to 20,000 characters and a string `value` of up to 1,000 characters. |

### Query forms

Submitting a query form makes a GET request to the same page endpoint. Each field becomes a URL-encoded query parameter. Empty values are included as empty strings and checkbox values are sent as `true` or `false`. A page can initially load without any query parameters. A saved query may be restored when the page opens again.

This component submits a request such as `GET v1/pages/service-health?environment=production`.

```json
{
  "id": "environment-filter",
  "type": "form",
  "mode": "query",
  "submitLabel": "Apply filter",
  "fields": [
    {
      "name": "environment",
      "label": "Environment",
      "type": "select",
      "value": "production",
      "options": [
        { "label": "Production", "value": "production" },
        { "label": "Staging", "value": "staging" }
      ]
    }
  ]
}
```

### Debounced query forms

Set `debounceMs` on a query form to submit after a quiet period following the latest field change. It accepts an integer from 0 to 2,147,483,647 milliseconds. The submit button is hidden and `submitLabel` is optional. The first automatic submission follows a user edit.

Each automatic request sends all current form fields and retains query parameters outside the form. Form fields take precedence for matching names. Clearing a field named `q` sends `q=` so the provider can clear the search filter. The same page endpoint handles manual and automatic queries.

The form remains editable while results load. Keep the form ID and its field names stable across responses so FolderTabber can retain the draft, focus, and text selection. Changing pages or removing the form cancels any scheduled submission.

```json
{
  "id": "service-search",
  "type": "form",
  "mode": "query",
  "debounceMs": 300,
  "fields": [{ "name": "q", "label": "Search services", "type": "text" }]
}
```

### Action forms

An action form includes an `action` descriptor. Its submitted fields are merged into `action.input`, with form values taking precedence when keys overlap. Edited text, textarea, and select values are strings. Checkbox values are booleans.

```json
{
  "id": "service-note-form",
  "type": "form",
  "mode": "action",
  "submitLabel": "Save note",
  "fields": [
    { "name": "note", "label": "Note", "type": "textarea", "required": true }
  ],
  "action": {
    "id": "save-note",
    "label": "Save note",
    "input": { "service": "api" }
  }
}
```

## Actions

### Action descriptors

A button, list entry, table row, or action form defines what the extension can submit.

| Field | Required | Value |
| --- | --- | --- |
| `id` | Yes | Identifier sent as `action` in the request |
| `label` | Yes | Button label, 1–200 characters. An action form uses its own `submitLabel` for the visible button. |
| `input` | Optional | Object with identifier keys and scalar values, defaults to `{}` |
| `confirm` | Optional | Confirmation text of up to 1,000 characters. A non-empty string prompts before the request is sent. |

### Action request

`POST v1/pages/service-health/actions` sends an object with three required fields. `requestId` is a UUID generated for this submission. `action` is the descriptor's ID. `input` contains the descriptor values and any submitted form values. FolderTabber sends the action in the request body and omits the page's query string.

```json
{
  "requestId": "2c153040-fac0-456f-b9d3-7b2323f3e3b2",
  "action": "save-note",
  "input": {
    "service": "api",
    "note": "Deployment reviewed"
  }
}
```

FolderTabber sends one POST per submission. If a failed request may have reached the provider, the extension asks the user to refresh before trying again.

### Action responses

Return one of these envelopes in an HTTP 2xx response. Both require `status` and a string `message` of up to 1,000 characters.

| `status` | Optional field | Behavior |
| --- | --- | --- |
| `success` | `refresh`, boolean, default `true` | Shows the message and reloads the page with its current query when `refresh` is true |
| `error` | `fieldErrors`, object, default `{}` | Shows the message and attaches errors to matching form field names. Each error is a string of up to 1,000 characters. |

```json
{
  "status": "success",
  "message": "Note saved",
  "refresh": true
}
```

```json
{
  "status": "error",
  "message": "Check the note",
  "fieldErrors": { "note": "Enter at least three characters" }
}
```

## Page CSS

Return a CSS string in the page's optional `css` field. FolderTabber scopes the styles to the page content using Shadow DOM. Select a component by its ID or use classes such as `.ft-metric`, `.ft-table`, `.ft-table__row`, `.ft-button`, `.ft-form`, and `.ft-input`. Set theme variables such as `--text-color`, `--page-background`, and `--control-radius` on `:host`.

```css
[data-component-id="health-summary"] {
  border-radius: 12px;
}
```

The CSS validator rejects resource-loading expressions such as `url()`, `image-set()`, `@import`, and `@font-face`. User-defined page CSS from the source settings is applied after the provider CSS.

## Connect the provider

In the extension, open **Custom pages** with the plus button in the sidebar. Enter the base URL and optional bearer token, click **Connect**, select the pages to show, and save the source. To pick up manifest changes such as new pages or icons, reconnect and save the source again.
