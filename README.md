
# MCP Workbench

A visual debugger and test client for **Model Context Protocol (MCP)** servers.

MCP Workbench lets you connect to an MCP server over **Streamable HTTP**, inspect protocol traffic, explore resources, and execute tools with zero guesswork. It’s built for developers who want fast feedback and full visibility into what their server is actually doing.

Built with **React, TypeScript, and Vite**.

![MCP Workbench Interface](https://modelcontextprotocol.io/img/mcp-logo.svg)

---

## What This Tool Is For

* Debugging MCP servers during development
* Verifying protocol compliance (handshake, capabilities, message flow)
* Manually testing tools, prompts, and resources
* Inspecting raw JSON-RPC traffic in real time

If you’re building or maintaining an MCP server, this is your control panel.

---

## Features

* **Streamable HTTP Client**

  * Implements the MCP *Streamable HTTP* transport exactly
  * All messages sent via `POST`
  * Session handling via `MCP-Session-Id`

* **Protocol Inspector**

  * Live JSON-RPC message log
  * See `initialize`, capability discovery, requests, and responses as they happen

* **Tool Runner**

  * Auto-generated input forms from JSON Schema
  * Execute tools and inspect raw responses

* **Resource Explorer**

  * Browse and inspect server-exposed resources

* **Prompt Viewer**

  * List and test available prompts

* **Authentication Support**

  * OAuth 2.0 (Authorization Code flow with popup)
  * API key support via custom headers

* **Multi-Server Configs**

  * Save, switch, and reuse multiple MCP server connections

---

## Getting Started

### Requirements

* Node.js **18+**
* npm or yarn

### Setup

```bash
git clone https://github.com/conductoross/mcp-workbench.git
cd mcp-workbench
npm install
npm run dev
```

Open:

```
http://localhost:5173
```

---

## Transport Details (Important)

MCP Workbench only supports **Streamable HTTP**.

* **Transport**: HTTP `POST` only
* **State**: Client-managed
* **Sessions**:

  * The server returns `MCP-Session-Id` during initialization
  * The client automatically includes it on subsequent requests

### CORS

Your MCP server **must** allow cross-origin requests from the Workbench origin. If CORS is misconfigured, requests will fail silently in the browser.

---

## Local MCP Servers

If your MCP server is running locally, expose it with `ngrok`:

```bash
ngrok http 8080
```

Paste the public ngrok URL into MCP Workbench.

The client automatically sets:

```
ngrok-skip-browser-warning: true
```

No extra configuration needed.

---

## Contributing

Pull requests are welcome.

Keep changes focused, readable, and aligned with MCP specifications.

---

## License

[MIT License](LICENSE)

---
