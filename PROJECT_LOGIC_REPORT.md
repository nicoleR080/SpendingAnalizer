# Bank of Scotland & Lloyds Spending Analyzer — System Logic & Settings Manual

> **Purpose of this Document**: This report serves as a complete, deterministic reference manual of the core rules, behavioral workflows, categorisation logic, and system configurations established for this application. If chat history or session state is ever reset, providing this document will immediately restore the exact behavioral expectations and implementation rules.

---

## 1. Central Architecture & Data Persistence

### 1.1 Central Configuration: `user_data.json`
- **File Location**: `/user_data.json`
- **Role**: Serves as the master initial seed and configuration baseline for custom categories, keyword mapping dictionaries, user rules, and item categorisations.
- **Structure**:
  - `version`: Schema version (e.g. `"1.0.0"`).
  - `appName`: Application identifier.
  - `lastUpdated`: ISO-8601 timestamp.
  - `settings`: System-wide preferences (currency, auto-propagation flags, savings category mappings).
  - `customCategories`: Array of user-created `CategoryDefinition` objects (with id, name, description, color, badges, and keyword arrays).
  - `customRules`: Ordered array of user keyword rules (`{ id, keyword, categoryId, createdAt }`).
  - `categoryKeywords`: Mapping of category ID to active match keywords (`Record<string, string[]>`).
  - `overrides`: Mapping of transaction IDs and normalized item names to target category IDs (`Record<string, string>`).

### 1.2 Data Flow & Storage Hierarchy
1. **Startup / Hydration**: 
   - The application first initializes from `user_data.json`.
   - If LocalStorage contains updated state (e.g., categories, rules, or overrides modified in the active browser session), it merges and layers over the baseline.
   - If an imported backup JSON is uploaded, it takes highest precedence and restores all categories, rules, overrides, and keyword mappings immediately.
2. **Real-Time State Synchronization**:
   - Any creation, edit, or deletion of custom categories, keyword rules, or transaction overrides immediately updates internal React state and writes to persistent storage.
   - The in-memory state is always kept ready for 1-click **Export**.

---

## 2. Categorization Logic & Rules

### 2.1 Categorization Priority Ladder (Deterministic Execution)
When a transaction is parsed or re-evaluated, its final category is determined using the following strict waterfall order:

```
[1. Specific Transaction ID Override]
       │
       ▼ (if none)
[2. Exact / Trimmed Description Override]
       │
       ▼ (if none)
[3. Custom User Rules (CustomRule[])]
       │   • Case-insensitive substring matching
       │   • Longest matching keyword evaluated first
       ▼ (if none)
[4. Custom Categories Keyword Dictionaries]
       │   • Custom category keyword lists defined by user
       ▼ (if none)
[5. Built-In Category Default Keyword Dictionaries]
       │   • Savings, Food, Housing, Transport, Leisure, Income
       ▼ (if none)
[6. Auto-Inflow / Auto-Credit Heuristic]
       │   • If transaction has Credit Amount / Inflow, fallback to 'income'
       ▼ (if none)
[7. 'uncategorized']
       │   • Displayed in amber with 1-click review trigger
```

### 2.2 Automatic Propagation Across Identical Item Names
- **Core Rule**: Whenever a user chooses or modifies the category of any transaction (via the Review Modal or the Transaction Table dropdown):
  1. The category is applied to the selected transaction ID.
  2. The application **automatically applies the same category to all transactions sharing the identical description/merchant name**.
  3. A persistent rule is saved so that identical items and any future CSV imports with that description automatically receive the chosen category.
  4. An informative confirmation toast confirms how many transactions with that name were updated simultaneously.

### 2.3 Custom Category Management Rules
- **Category Uniqueness**: Every category must have a unique `id` and unique `name`.
- **Custom Badge & Palette**: Custom categories support custom hex colors and generate matching accessible badge background and border styling.
- **Custom Keywords**: Custom categories have editable keyword arrays that participate directly in automatic matching.
- **Deletion Safety**: Deleting a custom category cascades cleanly — any transactions assigned to that category fall back to standard rule evaluation or `'uncategorized'`, avoiding orphan state.

---

## 3. Financial Metrics & Dashboard Formulas

### 3.1 Metrics Overview
| Metric | Calculation / Source | Description |
| :--- | :--- | :--- |
| **Total Inflows** | $\sum \text{Credit Amounts}$ | Total money received (salary, transfers, refunds, dividends). |
| **Total Outflows** | $\sum \text{Debit Amounts}$ | Total money spent or transferred out. |
| **Outgoing Minus Saving** | $\max(0, \text{Total Outflows} - \text{Total Saved})$ | **Pure living and operational costs** excluding money moved to savings/investments. |
| **Saved & Invested** | $\sum \text{Outflows with Category } \in \text{Savings}$ | Total wealth accumulated in trading, ISAs, pots, and investment accounts. |
| **Savings Rate** | $(\text{Total Saved} / \text{Total Inflows}) \times 100\%$ | Proportion of total incoming revenue directed into savings. |
| **Net Cash Flow** | $\text{Total Inflows} - \text{Total Outflows}$ | Overall financial surplus $(+)$ or deficit $(-)$. |

### 3.2 Outgoing Minus Saving Definition
- Outflows categorized under `savings` (or any custom category marked as a savings asset) represent capital transfers rather than consumed expenses.
- The **"Outgoing Minus Saving"** KPI card computes $\text{Total Outflows} - \text{Total Saved}$ to give an honest, unskewed view of true monthly burn rate.

---

## 4. Bank of Scotland & Lloyds CSV Parsing Specifications

### 4.1 Input Format Compatibility
- Supports standard Bank of Scotland and Lloyds export headers:
  - `Transaction Date` (formatted as `DD/MM/YYYY` or `DD-MM-YYYY` or `YYYY-MM-DD`).
  - `Transaction Type` (e.g. `DEB`, `CPT`, `FPO`, `DD`, `SO`, `PAY`, `TFR`).
  - `Sort Code` / `Account Number`.
  - `Transaction Description` (cleaned of extra whitespace and special delimiter symbols).
  - `Debit Amount` (parsed into float; negative signs sanitized).
  - `Credit Amount` (parsed into float).
  - `Balance` (optional running account balance).

---

## 5. Export / Import Backup Specification

### 5.1 Backup Schema (`my_categories_backup.json`)
The exported backup file contains:
```json
{
  "version": "1.0.0",
  "appName": "Bank of Scotland & Lloyds Spending Analyzer",
  "exportedAt": "2026-08-24T20:56:00.000Z",
  "settings": {
    "currency": "GBP",
    "currencySymbol": "£",
    "autoApplyToSameItems": true,
    "autoCreateRuleOnAssign": true,
    "savingsCategoryIds": ["savings"]
  },
  "customCategories": [ ... ],
  "customRules": [ ... ],
  "categoryKeywords": { ... },
  "overrides": { ... }
}
```

### 5.2 Import Protocol
1. User clicks **"Import Data"** and selects a `.json` backup file.
2. The file is validated for correct schema structure.
3. Custom categories, rules, keyword maps, and overrides are immediately updated in application state, written to storage, and all loaded transactions are instantaneously re-categorized with the restored configuration.
4. A success toast displays the number of restored categories and rules.

---

## 6. How to Test the Export & Import Cycle

1. **Create or Edit Categories**:
   - Click **"+ Categories"** in the top navigation and create a custom category (e.g., *"Pet Care"*, *"Fitness & Gym"*).
   - In the transaction table or Uncategorized Review modal, assign transactions to your new category.
2. **Export Backup**:
   - Click the **"Data"** / **"Export Data"** button in the header navigation.
   - Your browser will download `my_categories_backup.json`.
3. **Test Reset & Restore**:
   - Clear storage or modify categories.
   - Click **"Import Data"** and select `my_categories_backup.json`.
   - Notice that all your custom categories, keyword mappings, manual assignments, and same-name rules are restored with zero data loss.
