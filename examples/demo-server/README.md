# Demo MCP Server

A comprehensive demo server showcasing all Model Context Protocol features for testing the MCP Workbench.

## Features

- **Tools**: Calculator, weather, UUID generator, echo
- **Prompts**: Code review, summarize, debug assistant templates
- **Resources**: Documentation and configuration files
- **CORS Enabled**: Ready for browser-based testing

## Quick Start

```bash
# Install dependencies
cd examples/demo-server
npm install

# Build and run
npm run dev
```

The server will start on `http://localhost:8080/mcp`

## Testing in MCP Workbench

1. Open the MCP Workbench
2. Click **+ Add Server**
3. Enter URL: `http://localhost:8080/mcp`
4. Choose **Streamable HTTP** transport
5. Click **Connect**

## Available Tools

### calculator
Perform arithmetic operations (add, subtract, multiply, divide)

**Example:**
```json
{
  "operation": "add",
  "a": 10,
  "b": 5
}
```

### get_weather
Get simulated weather data for any city

**Example:**
```json
{
  "city": "San Francisco",
  "units": "celsius"
}
```

### generate_uuid
Generate a random UUID v4 (no parameters required)

### echo
Echo back any message

**Example:**
```json
{
  "message": "Hello, MCP!"
}
```

## Available Prompts

- **code_review**: Generate code review templates
- **summarize**: Create summary templates
- **debug_assistant**: Get debugging help prompts

## Available Resources

- `demo://docs/getting-started`: Getting started guide
- `demo://config/server.json`: Server configuration
- `demo://docs/api-reference`: API documentation

## CORS Configuration

The server includes proper CORS headers for browser access:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: POST, OPTIONS`
- `Access-Control-Allow-Private-Network: true` (Safari support)

## License

MIT License - Copyright 2026 Orkes, Inc.
