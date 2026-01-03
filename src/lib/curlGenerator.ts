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

import { ServerConfig } from "@/types";

export function getHeadersForServer(config: ServerConfig): Record<string, string> {
    const headers: Record<string, string> = { ...config.customHeaders };

    // Standard Content-Type for JSON-RPC
    headers['Content-Type'] = 'application/json';

    // Auth Headers
    if (config.auth?.type === 'apikey' && config.auth.token) {
        headers[config.auth.headerName || 'X-API-Key'] = config.auth.token;
    } else if (config.auth?.type === 'oauth' && config.auth.token) {
        headers['Authorization'] = `Bearer ${config.auth.token}`;
    }

    // ngrok bypass
    headers['ngrok-skip-browser-warning'] = 'true';

    return headers;
}

export function generateCurlCommand(url: string, headers: Record<string, string>, body: any): string {
    let cmd = `curl -X POST "${url}" \\\n`;

    // Headers
    Object.entries(headers).forEach(([key, value]) => {
        cmd += `  -H "${key}: ${value}" \\\n`;
    });

    // Body
    // Escape single quotes for shell safety if wrapping in single quotes, 
    // but here we might just double quote properly for JSON? 
    // Safest is to use -d @- or just carefully stringify.
    // For display purposes, single quotes around JSON is usually best in bash.
    const jsonBody = JSON.stringify(body);
    const escapedBody = jsonBody.replace(/'/g, "'\\''"); // Escape single quotes inside the body

    cmd += `  -d '${escapedBody}'`;

    return cmd;
}
