#!/usr/bin/env node

/**
 * MCP Stdio Bridge
 * 
 * This script bridges a local Stdio MCP server to a temporary HTTP server,
 * allowing the browser-based MCP Workbench to connect to it.
 * 
 * Usage:
 *   node scripts/stdio-bridge.js "node path/to/server.js"
 */

import express from "express";
import cors from "cors";
import { spawn } from "child_process";

const args = process.argv.slice(2);
if (args.length === 0) {
    console.error("Usage: node scripts/stdio-bridge.js \"<command> [args...]\"");
    process.exit(1);
}

// The first argument is the full command string if quoted, or just the executable
// Use shell spawning to handle generic command strings
const fullCommand = args[0];

console.log(`[Bridge] Starting Stdio Server with command: ${fullCommand}`);

// Create Express App
const app = express();
app.use(cors());
app.use(express.json()); // Essential for POST JSON-RPC

// --- Bridge Logic ---

const PORT = 3001;

// Spawn process
const child = spawn(fullCommand, {
    shell: true,
    stdio: ['pipe', 'pipe', 'inherit'] // pipe stdin/out, inherit stderr so we see logs in terminal
});

child.on('error', (err) => {
    console.error(`[Bridge] Failed to start subprocess: ${err}`);
});

child.on('exit', (code) => {
    console.log(`[Bridge] Subprocess exited with code ${code}`);
    process.exit(code || 0);
});

// JSON-RPC Message Buffer
let responseMap = new Map();

// Read stdout line-by-line (JSON-RPC)
let buffer = "";
child.stdout.on("data", (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop() || ""; // Keep incomplete line

    for (const line of lines) {
        if (!line.trim()) continue;
        try {
            const message = JSON.parse(line);

            if (message.id !== undefined && responseMap.has(message.id)) {
                // It's a response to a request we are waiting for
                const resolver = responseMap.get(message.id);
                resolver && resolver(message);
                responseMap.delete(message.id);
            } else {
                console.log("[Bridge] Unhandled Message from Stdio (Notification/Sampling?):", message);
            }
        } catch (e) {
            console.error("[Bridge] Error parsing JSON from Stdio:", e);
        }
    }
});

app.post("/mcp", async (req, res) => {
    const message = req.body;
    console.log("[Bridge] >> Sending to Stdio:", message);

    if (message.method === "notifications/initialized") {
        res.status(202).send("Accepted");
        // Still send to stdio
    }

    // Write to Stdio
    child.stdin.write(JSON.stringify(message) + "\n");

    // If it's a notification (no ID), return immediately
    if (message.id === undefined) {
        if (!res.headersSent) res.status(202).send("Accepted");
        return;
    }

    // If it's a request, wait for response
    // Set a timeout to avoid hanging forever
    const timeout = setTimeout(() => {
        if (responseMap.has(message.id)) {
            responseMap.delete(message.id);
            res.status(504).json({ jsonrpc: "2.0", id: message.id, error: { code: -32603, message: "Bridge Timeout" } });
        }
    }, 30000);

    responseMap.set(message.id, (response) => {
        clearTimeout(timeout);
        res.json(response);
    });
});

app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`MCP Stdio Bridge running on http://localhost:${PORT}/mcp`);
    console.log(`Connect your Workbench to this URL.`);
    console.log(`==================================================\n`);
});
