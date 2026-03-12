# Domain Records Explorer

Internal tool for support engineers to search, filter, and inspect domain records. Built with Vue 3, Composition API, `<script setup>`, and Vite.

---

### Setup

- **Requirements**: Node 18+ and npm
- **Install dependencies**:

```bash
npm install
```

- **Run the dev server**:
  - **Prepare local env file**: copy the shared defaults into a local-only file so you can safely tweak failure modes:

    ```bash
    cp .env .env.local
    ```

  - **Simulate API failure modes**: edit `.env.local` and set `VITE_SIMULATE_API_ERROR` to one of:

    ```bash
    VITE_SIMULATE_API_ERROR=always  # mock API always throws
    # or
    VITE_SIMULATE_API_ERROR=random  # mock API randomly fails
    ```

  - **Start Vite dev server**:

    ```bash
    npm run dev
    ```

- **Run tests**:

```bash
npm test
```

---

### Approach

- **Modern Vue stack**: Vue 3 with the Composition API and `<script setup>` single-file components.
- **Composable data layer**: `useDomainRecords` encapsulates filters, pagination (page/pageSize/total), loading, and error state and is consumed by the root `App` component.
- **Mock API**: A small in-repo mock dataset (`src/mock/domains.json`) and `fetchDomains` function emulate a paginated HTTP API, including occasional failures, while keeping the exercise self-contained.
- **Presentational components**: Table, filters, and details panel are separated into focused components with a single responsibility.
- **Explicit states**: Loading, empty results, and error states are explicit in the UI so support engineers can quickly understand what is happening.

---

### Component Structure

- **`App.vue`**
  - Top-level layout and page chrome.
  - Connects `useDomainRecords` data to presentation components.
  - Holds the currently selected domain and passes it to the details panel.
- **`DomainFilters.vue`**
  - Controlled inputs for domain, registrar, and status using `v-model` bindings.
  - Emits changes which update the filters in `useDomainRecords`.
- **`DomainTable.vue`**
  - Displays domain records in a table optimized for quick scanning.
  - Highlights status with colored badges and exposes a `select` event when a row is clicked.
- **`DomainDetails.vue`**
  - Side panel showing richer information for the selected domain, including nameservers.
  - Handles incomplete data by showing sensible “Unknown” / “Not available” copy instead of breaking UI.
- **`useDomainRecords.ts`**
  - Vue composable responsible for:
    - Filters (domain, registrar, status)
    - Pagination state (current page, page size, total count)
    - Loading and error state
    - Fetching paged data from the mock API and exposing a `reload` method.

---

### Assumptions

- **Dataset size**: For this exercise the dataset is small enough to live in-memory inside the mock API. The frontend still talks to it as if it were a real backend that owns filtering and pagination.
- **Statuses**: Only `active`, `clientHold`, and `pendingTransfer` are considered, matching the exercise description.
- **Dates**: All timestamps are ISO 8601 strings. If a date is missing or invalid, the UI displays “Unknown” rather than failing.
- **Incomplete data**: Some records may have missing `registrar`, `nameservers`, or date fields; these are expected and handled explicitly in the UI.
- **List keys**: The data model has no `id` field. The UI uses `domain` (the FQDN) as the list key in the table. We assume domain names are unique within the scope of this tool; in a real system (e.g. audit logs or multi-registrar views) a stable record ID would be required.
- **Expiry visibility**: The app does not visually flag expired or expiring-soon domains in the list or details. Mock data may include domains with `expires_at` in the past (e.g. for testing); these are shown like any other record.
- **Authentication & authorization**: Omitted for this exercise; in reality, this tool would sit behind existing internal auth.

---

### Tradeoffs

- **Filtering and pagination location**: The mock `fetchDomains` function applies filters and pagination in one place (simulating a real backend), but uses an in-memory JSON dataset for simplicity. This keeps the frontend focused on a clean API boundary while still being easy to run and test locally.
- **Side panel vs modal / separate page**: A side panel allows support engineers to maintain context while browsing the table and switching between domains with minimal friction. A modal would cover too much of the table; a separate page would add extra navigation steps.
- **Input debounce**: Only the domain and registrar text inputs are debounced (in `DomainFilters`), so typing does not trigger a reload on every keystroke. Reset and status changes trigger an immediate reload so button and dropdown actions feel instant.
- **Testing**: The suite has 7 test files: the composable (`useDomainRecords`), `DomainTable`, `DomainFilters`, `DomainDetails`, `StatusBadge`, the API layer (`domainApi`), and date-format utilities (`format`). Coverage includes filters, pagination, reset, error and empty states, and keyboard/emit behavior. In a production system we would add integration and E2E coverage on top of this.
- **Styling**: Plain CSS is used with a small number of utility classes tailored to this view, rather than a full design system, to keep the exercise concise.

---

### Backend API Proposal

For a production system with a large dataset, the frontend would ideally consume a paginated API with server-side filtering. A possible contract:

- **Endpoint**
  - `GET /api/domains`

- **Query parameters**
  - `domain` (string, optional): case-insensitive partial match on the domain name.
  - `registrar` (string, optional): case-insensitive partial match on registrar name.
  - `status` (string, optional): one of `active`, `clientHold`, `pendingTransfer`.
  - `page` (integer, optional, default `1`): 1-based page index.
  - `pageSize` (integer, optional, default `10`, max e.g. `100`): number of results per page.

- **Response shape** (`200 OK`)

```json
{
  "data": [
    {
      "domain": "example.com",
      "registrar": "Acme Registrar",
      "status": "active",
      "created_at": "2010-01-15T10:00:00Z",
      "expires_at": "2030-01-15T10:00:00Z",
      "nameservers": ["ns1.example.com", "ns2.example.com"],
      "updated_at": "2024-10-01T12:34:56Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 123,
    "totalPages": 5
  }
}
```

- **Filtering strategy**
  - All filters are applied server-side.
  - Case-insensitive partial match on `domain` and `registrar` using indexes to keep lookups fast.
  - Simple equality match on `status`.
  - Responses are ordered by `updated_at` descending by default to surface recently changed domains first.

- **Error responses**
  - `400 Bad Request` for invalid parameters (e.g. unsupported `status` or negative `page`), returning:

    ```json
    {
      "error": {
        "code": "INVALID_QUERY",
        "message": "One or more query parameters are invalid.",
        "details": {
          "status": "Must be one of active, clientHold, pendingTransfer"
        }
      }
    }
    ```

  - `500 Internal Server Error` for unexpected backend issues:

    ```json
    {
      "error": {
        "code": "INTERNAL_ERROR",
        "message": "An unexpected error occurred."
      }
    }
    ```

The current frontend’s `fetchDomains` mock function is intentionally shaped so it could be replaced by a real HTTP call to this endpoint with minimal changes.

---

### Future Improvements

- **Real backend**: Replace the mock API with a real HTTP client for the proposed `/api/domains` endpoint. The UI already has Previous/Next pagination and filters; optionally add a page-size selector.
- **Expired / expiring domains**: Visually flag domains that are already expired or expiring soon (e.g. badge or row styling using `expires_at`), since these are common support investigation cases.
- **Sorting**: Allow sorting by domain name, registrar, status, created date, or expiry date via clickable column headers.
- **URL state**: Persist filters and selection to query parameters so that views can be shared and reloaded consistently.
- **Accessibility**: Further refine focus handling and keyboard interactions for the table and details panel.
- **Diagnostics**: Surface metadata such as registrar IDs, contact handles, or additional operational flags as needed by support workflows.
