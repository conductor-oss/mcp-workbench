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

    const handleSave = () => {
        let headers = {};
        try {
            headers = JSON.parse(customHeaders);
        } catch (e) {
            alert("Invalid JSON for Custom Headers");
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
        if (!authUrl) { alert("Missing Auth URL"); return; }
        if (!tokenUrl) { alert("Missing Token URL"); return; }
        // Client ID/Secret are optional (e.g. if pre-configured or public client)

        const redirectUri = window.location.origin;
        const state = crypto.randomUUID();
        const popupUrl = new URL(authUrl);
        popupUrl.searchParams.set('response_type', 'code');
        // Use provided ID or default to 'mcp-workbench' to satisfy "Missing required param"
        popupUrl.searchParams.set('client_id', clientId || 'mcp-workbench');
        popupUrl.searchParams.set('redirect_uri', redirectUri);
        popupUrl.searchParams.set('state', state);
        if (scope) popupUrl.searchParams.set('scope', scope);

        const popup = window.open(popupUrl.toString(), 'oauth_popup', 'width=600,height=700');

        const handleMessage = async (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            if (event.data?.type === 'oauth_code') {
                const code = event.data.code;
                popup?.close();
                window.removeEventListener('message', handleMessage);

                // Exchange code for token
                try {
                    const params = new URLSearchParams();
                    params.set('grant_type', 'authorization_code');
                    params.set('code', code);
                    params.set('redirect_uri', redirectUri);
                    params.set('client_id', clientId || 'mcp-workbench');
                    if (clientSecret) params.set('client_secret', clientSecret);

                    console.log("[ServerEditor] Exchanging token with params:", params.toString());

                    // Standard OAuth token exchange: POST with form body
                    const res = await fetch(tokenUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'ngrok-skip-browser-warning': 'true'
                        },
                        body: params
                    });
                    const data = await res.json();
                    if (data.access_token) {
                        setAuthToken(data.access_token);
                    } else {
                        alert("Failed to get token: " + JSON.stringify(data));
                    }
                } catch (e) {
                    alert("Error exchanging token: " + e);
                }
            }
        };

        window.addEventListener('message', handleMessage);
    };

    const discoverEndpoints = async () => {
        if (!url) {
            alert("Please enter a Server URL first to discover endpoints.");
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
                alert("Invalid Server URL");
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

            alert(`Discovery successful!\nAuth URL: ${config.authorization_endpoint}\nToken URL: ${config.token_endpoint}`);
        } catch (e: any) {
            console.error(e);
            alert("Discovery failed: " + e.message + "\nEnsure CORS is enabled on the server or manually enter URLs.");
        }
    };

    return (
        <div className="space-y-4 border p-4 rounded-md bg-solar-base2 border-solar-base1">
            <h3 className="font-medium text-solar-base01">Edit Server</h3>

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
