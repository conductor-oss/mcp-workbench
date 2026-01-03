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

import React, { useEffect, useState } from 'react';
import { useMCP } from '@/contexts/MCPContext';
import { Button } from '@/components/ui/button';
import { CurlPreview } from './CurlPreview';
import { z } from 'zod';

interface Resource {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
    content?: string;
    curl?: string;
}

const ListResourcesResultSchema = z.object({
    resources: z.array(z.object({
        uri: z.string(),
        name: z.string(),
        description: z.string().optional(),
        mimeType: z.string().optional()
    }))
});

export const ResourceExplorer: React.FC = () => {
    const { client, status, servers, activeServerId } = useMCP();
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [listCurl, setListCurl] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'connected' && client) {
            loadResources();
        } else {
            setResources([]);
        }
    }, [status, client]);

    const loadResources = async () => {
        console.log("[ResourceExplorer] loadResources called. Client:", !!client);
        if (!client) return;
        setLoading(true);
        setError(null);
        try {
            // Generate cURL
            const currentServer = servers.find(s => s.id === activeServerId);
            if (currentServer) {
                const { generateCurlCommand, getHeadersForServer } = await import('@/lib/curlGenerator');
                const headers = getHeadersForServer(currentServer);
                const body = {
                    jsonrpc: "2.0",
                    method: "resources/list",
                    id: 1
                };
                setListCurl(generateCurlCommand(currentServer.url, headers, body));
            }

            // @ts-ignore - The SDK might have different method names, but based on spec it often has listResources or request("resources/list")
            // If the SDK follows 1.0, it might use client.request({ method: "resources/list" })
            // Or client.listResources() if strictly typed wrapper.
            // I'll try the request method first as it's generic.
            console.log("[ResourceExplorer] Requesting resources/list...");

            const result = await client.request(
                { method: "resources/list" },
                ListResourcesResultSchema
            );
            console.log("[ResourceExplorer] result:", result);

            // @ts-ignore
            setResources(result.resources || []);
        } catch (e: any) {
            console.error("Failed to load resources", e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    // if (status !== 'connected') {
    //     return null;
    // }

    const readResource = async (uri: string) => {
        if (!client) return;
        try {
            // Generate cURL
            const currentServer = servers.find(s => s.id === activeServerId);
            if (currentServer) {
                const { generateCurlCommand, getHeadersForServer } = await import('@/lib/curlGenerator');
                const headers = getHeadersForServer(currentServer);
                const body = {
                    jsonrpc: "2.0",
                    method: "resources/read",
                    params: { uri },
                    id: 1
                };
                const cmd = generateCurlCommand(currentServer.url, headers, body);

                // Update specific resource with cURL command (requires state update)
                setResources(prev => prev.map(r => r.uri === uri ? { ...r, curl: cmd } : r));
            }

            const result = await client.request(
                { method: "resources/read", params: { uri } },
                z.object({ contents: z.array(z.any()) })
            );
            console.log("Resource Read:", result);
            // @ts-ignore
            const content = result.contents[0];
            const contentStr = content.text ? content.text : `[Binary: ${content.mimeType}]`;

            setResources(prev => prev.map(r => r.uri === uri ? { ...r, content: contentStr } : r));

        } catch (e: any) {
            console.error("Failed to read resource", e);
            setError(e.message);
        }
    };

    return (
        <div className="p-4 bg-solar-base2 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-solar-base01">Resources</h2>
                <div className="flex gap-2">
                    <button
                        onClick={loadResources}
                        className="text-sm text-solar-blue hover:text-solar-orange hover:underline transition-colors"
                        disabled={loading}
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {loading && <p className="text-solar-base1 text-sm">Loading resources...</p>}
            {error && <p className="text-solar-red text-sm">Error: {error}</p>}

            {listCurl && <div className="mb-4"><CurlPreview command={listCurl} title="cURL Command (resources/list)" /></div>}

            {!loading && !error && resources.length === 0 && (
                <p className="text-solar-base1 text-sm">No resources found.</p>
            )}

            <div className="space-y-4">
                {resources.map((resource: any) => (
                    <div key={resource.uri} className="p-3 bg-solar-base3 rounded-md border border-solar-base2 text-sm hover:border-solar-base1 transition-colors">
                        <div className="flex justify-between items-start">
                            <span className="font-medium truncate mr-2 text-solar-base00">{resource.name}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-solar-blue/20 text-solar-blue font-medium">
                                {resource.mimeType || 'unknown'}
                            </span>
                        </div>
                        <div className="text-xs text-solar-base1 mt-1 font-mono break-all">{resource.uri}</div>
                        {resource.description && (
                            <p className="text-solar-base1 mt-1">{resource.description}</p>
                        )}

                        <div className="mt-3 flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => readResource(resource.uri)}>
                                Read Resource
                            </Button>
                        </div>

                        {resource.content && (
                            <div className="mt-2 p-2 bg-solar-base2 rounded border border-solar-base1">
                                <pre className="text-xs whitespace-pre-wrap font-mono text-solar-base00 max-h-[200px] overflow-auto">
                                    {resource.content}
                                </pre>
                            </div>
                        )}

                        {resource.curl && <CurlPreview command={resource.curl} />}
                    </div>
                ))}
            </div>
        </div>
    );
};
