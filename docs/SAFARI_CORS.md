# Safari CORS Troubleshooting Guide

## Problem
Safari shows the error: `Fetch API cannot load http://localhost:8080/mcp due to access control checks.`

## Root Cause
Safari has stricter CORS (Cross-Origin Resource Sharing) requirements than Chrome or Firefox, particularly for localhost connections. It requires the `Access-Control-Allow-Private-Network` header for private network requests.

## Solution

Your MCP server at `http://localhost:8080/mcp` needs to send the following CORS headers in its responses:

### Required Headers

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key
Access-Control-Allow-Private-Network: true
```

### Implementation Examples

#### Node.js / Express Server

```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  res.header('Access-Control-Allow-Private-Network', 'true');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
```

#### Python / Flask Server

```python
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={
    r"/mcp": {
        "origins": "*",
        "methods": ["POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-API-Key"],
        "expose_headers": ["Access-Control-Allow-Private-Network"],
        "supports_credentials": False
    }
})

@app.after_request
def after_request(response):
    response.headers['Access-Control-Allow-Private-Network'] = 'true'
    return response
```

#### Using the stdio-bridge.js

If you're using the `scripts/stdio-bridge.js` to bridge a Stdio MCP server to HTTP, the bridge already includes CORS headers. However, you may need to add the Safari-specific header:

```javascript
// In scripts/stdio-bridge.js, update the CORS middleware:
app.use(cors({
  origin: '*',
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  exposedHeaders: ['Access-Control-Allow-Private-Network']
}));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Private-Network', 'true');
  next();
});
```

## Testing

After adding the headers:

1. **Restart your MCP server**
2. **Clear Safari's cache**: Safari > Settings > Privacy > Manage Website Data > Remove All
3. **Test the connection** in the MCP Workbench

## Verification

You can verify the headers are being sent using curl:

```bash
curl -i -X OPTIONS http://localhost:8080/mcp
```

You should see output including:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Private-Network: true
```

## Alternative: Use Chrome/Firefox for Development

If you cannot modify the server CORS configuration, you can use Chrome or Firefox for development, as they have less strict CORS policies for localhost.

## References

- [Safari Private Network Access](https://webkit.org/blog/13936/private-network-access/)
- [Supabase CORS Discussion](https://github.com/supabase/supabase/issues/20982)
- [MDN CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
