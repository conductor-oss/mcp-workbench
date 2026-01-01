# MCP Workbench

A powerful, visual tool for debugging and testing [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) servers. Built with React + TypeScript + Vite, it provides a premium developer experience for inspecting resources, executing tools, and monitoring protocol traffic in real-time.

![MCP Workbench Interface](https://modelcontextprotocol.io/img/mcp-logo.svg)

## 🚀 Features

- **Streamable HTTP Support**: Strictly adheres to the "Streamable HTTP" transport specification.
- **Protocol Inspector**: Real-time log viewer for all JSON-RPC messages, including `initialize` handshake and capability discovery.
- **Tools Tester**: Execute tools with dynamically generated forms based on their JSON Schema.
- **Resource Explorer**: Inspect and browse server-side resources.
- **Prompt Tester**: View and test available prompts.
- **Advanced Authentication**:
    - **OAuth 2.0**: Full Authorization Code flow with popup-based authentication.
    - **API Keys**: Custom header support for secure connections.
- **Multi-Server Management**: Save and manage multiple server configurations.

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/conductoross/mcp-workbench.git
   cd mcp-workbench
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. (Optional) Add license headers to new files:
   ```bash
   npm run add-license
   ```

5. Open your browser to `http://localhost:5173`.

## 📡 Transport & Connectivity

This workbench is designed specifically for **Streamable HTTP**. 

- **Method**: Every message is sent via `HTTP POST`.
- **Stateless**: The client manages the `MCP-Session-Id` header (captured from the server's initialization response).
- **CORS**: Ensure your MCP server is configured to allow requests from the workbench origin.

### Local Debugging with ngrok

If you are testing a local MCP server, we recommend using `ngrok` to expose it:

```bash
ngrok http 8080
```

The workbench automatically handles bypass headers for ngrok (`ngrok-skip-browser-warning: true`).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License.

