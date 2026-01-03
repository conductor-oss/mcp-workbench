# Ecommerce Support & Refund Agent (Stateful MCP Example)

This is a canonical example of a **Stateful MCP Server** designed for the MCP Workbench.
It simulates a Customer Service workflow where the "Ticket" object accumulates state over multiple turns.

## Use Case: Refund Resolution
The Agent (LLM) acts as a support rep. It must:
1.  **Open a ticket** (Validates order ID and 30-day return policy).
2.  **Assess items** individually (Applies policy logic like "no returns on opened underwear").
3.  **Calculate refund** (Server performs the math).
4.  **Close ticket** (Writes the final transaction).

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
    *(Note: If you hit EACCES errors, you may need to fix npm permissions: `sudo chown -R $(whoami) ~/.npm`)*

2.  **Build**:
    ```bash
    npm run build
    ```

3.  **Run**:
    ```bash
    node dist/index.js
    ```

## Connecting from Workbench

1.  Open **MCP Workbench**.
2.  Click **Add Connection**.
3.  Choose **Stdio** (if running via command) or **Streamable HTTP** (if you wrap this in Express).
    *   *Note: This example uses Stdio transport by default for simplicity.*
    *   **Command**: `node`
    *   **Args**: `/path/to/mcp-workbench/examples/ecommerce-support-server/dist/index.js`
