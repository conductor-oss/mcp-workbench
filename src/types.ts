export interface ServerConfig {
    id: string;
    name: string;
    url: string;
    transportType: 'sse' | 'websocket' | 'http-direct';
    auth?: {
        type: 'none' | 'apikey' | 'oauth';
        headerName?: string;
        token?: string;
        // OAuth specific
        authUrl?: string;
        tokenUrl?: string;
        clientId?: string;
        clientSecret?: string;
        scope?: string;
    };
    customHeaders?: Record<string, string>;
}

export const DEFAULT_SERVER_CONFIG: ServerConfig = {
    id: 'default',
    name: 'Default Localhost',
    url: 'http://localhost:3000/mcp',
    transportType: 'http-direct',
    auth: { type: 'none' },
    customHeaders: {}
};
