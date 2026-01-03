/*
 * Copyright 2026 Orkes, Inc.
 *
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 * https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { ServerConfig, DEFAULT_SERVER_CONFIG } from '@/types';

import { InspectableTransport, LogEntry } from '@/lib/InspectableTransport';
import { DirectClientTransport } from '@/lib/DirectClientTransport';
import { z } from 'zod';

interface MCPContextType {
    client: Client | null;
    status: 'disconnected' | 'connecting' | 'connected' | 'error';
    error: string | null;
    isAuthRequired: boolean;
    logs: LogEntry[];
    clearLogs: () => void;
    activeServerId: string | null;
    servers: ServerConfig[];
    addServer: (server: ServerConfig) => void;
    updateServer: (server: ServerConfig) => void;
    removeServer: (id: string) => void;
    connectToServer: (id: string, configOverride?: ServerConfig) => Promise<void>;
    reauthenticateServer: (id: string) => Promise<void>;
    disconnect: () => Promise<void>;
}

const MCPContext = createContext<MCPContextType | null>(null);

export const useMCP = () => {
    const context = useContext(MCPContext);
    if (!context) {
        throw new Error('useMCP must be used within a MCPProvider');
    }
    return context;
};

export const MCPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
    const [error, setError] = useState<string | null>(null);
    const [isAuthRequired, setIsAuthRequired] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const clientRef = useRef<Client | null>(null);

    // Storage
    const [servers, setServers] = useState<ServerConfig[]>(() => {
        const stored = localStorage.getItem('mcp_servers');
        return stored ? JSON.parse(stored) : [DEFAULT_SERVER_CONFIG];
    });
    const [activeServerId, setActiveServerId] = useState<string | null>(null);

    useEffect(() => {
        localStorage.setItem('mcp_servers', JSON.stringify(servers));
    }, [servers]);

    const addServer = (server: ServerConfig) => {
        setServers(prev => [...prev, server]);
    };

    const updateServer = (server: ServerConfig) => {
        setServers(prev => prev.map(s => s.id === server.id ? server : s));
    };

    const removeServer = (id: string) => {
        setServers(prev => prev.filter(s => s.id !== id));
        if (activeServerId === id) {
            disconnect();
            setActiveServerId(null);
        }
    };

    const clearLogs = () => setLogs([]);

    const disconnect = useCallback(async () => {
        if (clientRef.current) {
            try {
                await clientRef.current.close();
            } catch (e) {
                console.error("Failed to close client", e);
            }
            clientRef.current = null;
        }
        setStatus('disconnected');
        setError(null);
        setIsAuthRequired(false);
        setActiveServerId(null);
    }, []);

    // Allows passing a config override (e.g. with fresh token before state update propagates)
    const connectToServer = useCallback(async (id: string, configOverride?: ServerConfig) => {
        const storedConfig = servers.find(s => s.id === id);
        const config = configOverride || storedConfig;

        if (!config) {
            setError("Server configuration not found");
            return;
        }

        await disconnect();
        setActiveServerId(id);
        setStatus('connecting');
        setError(null);
        setLogs([]); // Clear logs on new connection

        try {
            let transport;

            // Prepare headers
            const headers: Record<string, string> = { ...config.customHeaders };
            if (config.auth?.type === 'apikey' && config.auth.token) {
                headers[config.auth.headerName || 'X-API-Key'] = config.auth.token;
            } else if (config.auth?.type === 'oauth' && config.auth.token) {
                headers['Authorization'] = `Bearer ${config.auth.token}`;
            }

            // Add MCP-Session-Id
            // REMOVED: Server determines session ID. We do not generate it client-side.
            // const sessionId = crypto.randomUUID();
            // headers['MCP-Session-Id'] = sessionId;
            headers['ngrok-skip-browser-warning'] = 'true'; // Bypass ngrok warning page

            // ... (in connectToServer logic)

            // Direct / Streamable HTTP (POST-Only)
            console.log("[MCP Workbench] Connecting via Streamable HTTP (POST-only) with headers:", headers);
            transport = new DirectClientTransport(new URL(config.url), headers);

            // Wrap transport for inspection
            const inspectableTransport = new InspectableTransport(transport, (entry) => {
                console.log("[MCPContext] Adding log entry:", entry.type, entry.method);
                setLogs(prev => [...prev, entry]);
            });

            // Handle unauthorized
            (inspectableTransport as any).onUnauthorized = () => {
                console.warn("[MCPContext] Transport reported 401. Marking auth as required.");
                setIsAuthRequired(true);
                setError("Authentication expired. Please re-authenticate.");
            };

            const client = new Client(
                {
                    name: "mcp-workbench",
                    version: "1.0.0",
                },
                {
                    capabilities: {
                        sampling: {},
                    },
                }
            );

            await client.connect(inspectableTransport);
            clientRef.current = client;
            setStatus('connected');

            // Force discovery to generate logs
            console.log("[MCP Workbench] Connected. Fetching capabilities...");
            Promise.allSettled([
                client.request({ method: "tools/list" }, z.any()),
                client.request({ method: "resources/list" }, z.any()),
                client.request({ method: "prompts/list" }, z.any())
            ]).then(() => {
                console.log("[MCP Workbench] Initial discovery complete.");
            });

            // Auto-discover resources/tools/prompts to generate traffic and populate UI
            console.log("[MCP Workbench] Connection/Handshake complete. Discovering capabilities...");
            try {
                // We don't store these here yet (ResourceExplorer etc. fetch them themselves usually),
                // but fetching them triggers the logs the user wants to see.
                // NOTE: In a real app, components should fetch what they need. 
                // However, the Components (ToolTester, ResourceExplorer) rely on 'client' presence.
                // We'll trust the components to fetch when they render, 
                // BUT the user interaction flow might imply they expect it immediately.

                // Let's just log that we are connected. The components will trigger the fetches 
                // if they are mounted.
                // If the user is on the "Resources" tab, ResourceExplorer will fetch.
            } catch (err) {
                console.error("Discovery error", err);
            }
        } catch (e: any) {
            console.error(e);
            setStatus('error');
            setError(e.message || 'Failed to connect');
        }
    }, [disconnect, servers]);

    const reauthenticateServer = useCallback(async (id: string) => {
        const config = servers.find(s => s.id === id);
        if (!config || config.auth?.type !== 'oauth') return;

        try {
            const { initiateOAuthFlow } = await import('@/lib/oauth');
            const token = await initiateOAuthFlow({
                authUrl: config.auth.authUrl!,
                tokenUrl: config.auth.tokenUrl!,
                clientId: config.auth.clientId || 'mcp-workbench',
                clientSecret: config.auth.clientSecret,
                scope: config.auth.scope,
            });

            const updatedServer = {
                ...config,
                auth: { ...config.auth, token }
            };
            updateServer(updatedServer);

            // Reconnect automatically with strict fresh config
            await connectToServer(id, updatedServer);
        } catch (e: any) {
            console.error("Re-authentication failed", e);
            setError("Re-authentication failed: " + e.message);
        }
    }, [servers, updateServer, connectToServer]);

    return (
        <MCPContext.Provider value={{
            client: clientRef.current,
            status,
            error,
            logs,
            clearLogs,
            isAuthRequired,
            activeServerId,
            servers,
            addServer,
            updateServer,
            removeServer,
            connectToServer,
            reauthenticateServer,
            disconnect
        }}>
            {children}
        </MCPContext.Provider>
    );
};
