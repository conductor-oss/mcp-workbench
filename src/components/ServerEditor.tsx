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

import React, { useState } from 'react';
import { ServerConfig } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ServerEditorProps {
    config: ServerConfig;
    onSave: (config: ServerConfig) => void;
    onCancel: () => void;
}

export const ServerEditor: React.FC<ServerEditorProps> = ({ config, onSave, onCancel }) => {
    const [name, setName] = useState(config.name);
    const [url, setUrl] = useState(config.url);
    const [transportType, setTransportType] = useState(config.transportType);
    const [authType, setAuthType] = useState(config.auth?.type || 'none');
    const [authHeader, setAuthHeader] = useState(config.auth?.headerName || '');
    const [authToken, setAuthToken] = useState(config.auth?.token || '');
    const [customHeaders, setCustomHeaders] = useState<string>(
        config.customHeaders ? JSON.stringify(config.customHeaders, null, 2) : '{}'
    );

    const [authUrl, setAuthUrl] = useState(config.auth?.authUrl || '');
    const [tokenUrl, setTokenUrl] = useState(config.auth?.tokenUrl || '');
    const [clientId, setClientId] = useState(config.auth?.clientId || '');
    const [clientSecret, setClientSecret] = useState(config.auth?.clientSecret || '');
    const [scope, setScope] = useState(config.auth?.scope || '');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSave = () => {
        let headers = {};
        try {
            headers = JSON.parse(customHeaders);
        } catch (e) {
            setError("Invalid JSON for Custom Headers");
            return;
        }

        onSave({
            ...config,
            name,
            url,
            transportType,
            auth: {
                type: authType,
                headerName: authHeader,
                token: authToken,
                authUrl,
                tokenUrl,
                clientId,
                clientSecret,
                scope
            },
            customHeaders: headers
        });
    };

    const handleOAuthFlow = async () => {
        try {
            const { initiateOAuthFlow } = await import('@/lib/oauth');
            const token = await initiateOAuthFlow({
                authUrl,
                tokenUrl,
                clientId: clientId || 'mcp-workbench',
                clientSecret,
                scope
            });
            setAuthToken(token);
            setSuccessMessage("Authentication successful!");
            setError(null);
        } catch (e: any) {
            setError(e.message);
            setSuccessMessage(null);
        }
    };

    const discoverEndpoints = async () => {
        if (!url) {
            setError("Please enter a Server URL first to discover endpoints.");
            return;
        }

        try {
            // Try OIDC discovery first
            // Isolate origin from the server URL
            let baseUrl = "";
            try {
                const u = new URL(url);
                baseUrl = u.origin;
            } catch (e) {
                setError("Invalid Server URL");
                return;
            }

            const wellKnownUrl = `${baseUrl}/.well-known/openid-configuration`;
            const res = await fetch(wellKnownUrl);
            if (!res.ok) {
                throw new Error(`Failed to fetch ${wellKnownUrl}`);
            }
            const config = await res.json();

            if (config.authorization_endpoint) setAuthUrl(config.authorization_endpoint);
            if (config.token_endpoint) setTokenUrl(config.token_endpoint);

            setSuccessMessage(`Discovery successful!\nAuth URL: ${config.authorization_endpoint}\nToken URL: ${config.token_endpoint}`);
            setError(null);
        } catch (e: any) {
            console.error(e);
            setError("Discovery failed: " + e.message + "\nEnsure CORS is enabled on the server or manually enter URLs.");
            setSuccessMessage(null);
        }
    };

    return (
        <div className="space-y-4 border p-4 rounded-md bg-solar-base2 border-solar-base1">
            <h3 className="font-medium text-solar-base01">Edit Server</h3>

            {error && (
                <div className="bg-solar-red/10 border border-solar-red text-solar-red p-2 rounded text-sm whitespace-pre-wrap">
                    {error}
                </div>
            )}
            {successMessage && (
                <div className="bg-solar-green/10 border border-solar-green text-solar-green p-2 rounded text-sm whitespace-pre-wrap">
                    {successMessage}
                </div>
            )}

            <div className="space-y-2">
                <label className="text-xs text-solar-base1 uppercase font-bold tracking-wide">Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                    <label className="text-xs text-solar-base1 uppercase font-bold tracking-wide">URL</label>
                    <Input value={url} onChange={e => setUrl(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <label className="text-xs text-solar-base1 uppercase font-bold tracking-wide">Type</label>
                    <select
                        className="flex h-10 w-full rounded-md border border-solar-base1 bg-solar-base3 px-3 py-2 text-sm text-solar-base00 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-solar-blue"
                        value={transportType}
                        onChange={e => setTransportType(e.target.value as any)}
                    >
                        {/* <option value="sse">SSE (Standard)</option>
                        <option value="websocket">WebSocket</option> */}
                        <option value="http-direct">Streamable HTTP (Stateless)</option>
                    </select>
                </div>
            </div>

            <div className="space-y-2 border-t border-solar-base1/50 pt-2">
                <label className="text-xs font-bold text-solar-base1 uppercase tracking-wide">Authentication</label>
                <select
                    className="flex h-10 w-full rounded-md border border-solar-base1 bg-solar-base3 px-3 py-2 text-sm text-solar-base00 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-solar-blue"
                    value={authType}
                    onChange={e => setAuthType(e.target.value as any)}
                >
                    <option value="none">None</option>
                    <option value="apikey">API Key (e.g. X-API-Key)</option>
                    <option value="oauth">OAuth / Bearer Token</option>
                </select>

                {authType !== 'none' && (
                    <div className="space-y-4 pt-2">
                        {authType === 'apikey' && (
                            <div className="space-y-2">
                                <label className="text-xs text-solar-base1 uppercase font-bold tracking-wide">Header Name</label>
                                <Input
                                    placeholder="Header Name (e.g. X-API-Key)"
                                    value={authHeader}
                                    onChange={e => setAuthHeader(e.target.value)}
                                />
                            </div>
                        )}

                        {authType === 'oauth' && (
                            <div className="space-y-2 border border-solar-base1 p-3 rounded-md bg-solar-base2">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-xs font-bold text-solar-base00">OAuth Configuration</h4>
                                    <Button size="sm" variant="outline" onClick={discoverEndpoints} className="bg-solar-base3 text-xs h-7">
                                        Auto-Discover
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-xs text-solar-base1">Auth URL</label>
                                        <Input placeholder="https://..." value={authUrl} onChange={e => setAuthUrl(e.target.value)} />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-xs text-solar-base1">Token URL</label>
                                        <Input placeholder="https://..." value={tokenUrl} onChange={e => setTokenUrl(e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-solar-base1">Client ID</label>
                                        <Input value={clientId} onChange={e => setClientId(e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-solar-base1">Client Secret</label>
                                        <Input type="password" value={clientSecret} onChange={e => setClientSecret(e.target.value)} />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-xs text-solar-base1">Scopes</label>
                                        <Input placeholder="openid profile..." value={scope} onChange={e => setScope(e.target.value)} />
                                    </div>
                                    <div className="col-span-2 pt-2">
                                        <Button size="sm" onClick={handleOAuthFlow} className="w-full bg-solar-blue text-white hover:bg-solar-blue/90">
                                            Authenticate via Browser
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs text-solar-base1 uppercase font-bold tracking-wide">
                                {authType === 'apikey' ? "API Key" : "Access Token"}
                            </label>
                            <Input
                                type="password"
                                placeholder={authType === 'apikey' ? "Key Value" : "Bearer Token Value"}
                                value={authToken}
                                onChange={e => setAuthToken(e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <label className="text-xs text-solar-base1 uppercase font-bold tracking-wide">Custom Headers (JSON)</label>
                <textarea
                    className="flex min-h-[60px] w-full rounded-md border border-solar-base1 bg-solar-base3 px-3 py-2 text-xs font-mono text-solar-base00 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-solar-blue"
                    value={customHeaders}
                    onChange={e => setCustomHeaders(e.target.value)}
                />
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={onCancel} size="sm">Cancel</Button>
                <Button onClick={handleSave} size="sm">Save</Button>
            </div>
        </div>
    );
};
