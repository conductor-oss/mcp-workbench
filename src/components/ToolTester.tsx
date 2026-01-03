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
import { z } from 'zod';
import { DynamicForm } from './DynamicForm';
import { CurlPreview } from './CurlPreview';
import { Code, LayoutList } from 'lucide-react';

export const ToolTester: React.FC = () => {
    const { client, status, servers, activeServerId } = useMCP();
    const [tools, setTools] = useState<any[]>([]);
    const [selectedTool, setSelectedTool] = useState<any | null>(null);
    const [args, setArgs] = useState("{}");
    const [formValues, setFormValues] = useState<any>({});
    const [inputMode, setInputMode] = useState<'form' | 'json'>('form');
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [curlCommand, setCurlCommand] = useState<string | null>(null);
    const [listCurl, setListCurl] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'connected' && client) {
            loadTools();
        } else {
            setTools([]);
            setSelectedTool(null);
        }
    }, [status, client]);

    const loadTools = async () => {
        console.log("[ToolTester] loadTools called. Status:", status, "Client:", !!client);
        if (!client) return;
        setLoading(true);
        setError(null);
        try {
            // Generate cURL for list
            const currentServer = servers.find(s => s.id === activeServerId);
            if (currentServer) {
                const { generateCurlCommand, getHeadersForServer } = await import('@/lib/curlGenerator');
                const headers = getHeadersForServer(currentServer);
                const body = {
                    jsonrpc: "2.0",
                    method: "tools/list",
                    id: 1
                };
                setListCurl(generateCurlCommand(currentServer.url, headers, body));
            }

            console.log("[ToolTester] Requesting tools/list...");
            const result = await client.request(
                { method: "tools/list" },
                z.object({ tools: z.array(z.any()) }) // Validate tools array exists
            );
            console.log("[ToolTester] tools/list result:", result);
            // @ts-ignore
            setTools(result.tools || []);
        } catch (e: any) {
            console.error("Failed to load tools", e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRunTool = async () => {
        if (!client || !selectedTool) return;

        setLoading(true);
        setResult(null);
        setError(null);
        try {
            const parsedArgs = JSON.parse(args);

            // Generate cURL for debug
            const currentServer = servers.find(s => s.id === activeServerId);
            if (currentServer) {
                const { generateCurlCommand, getHeadersForServer } = await import('@/lib/curlGenerator');
                const headers = getHeadersForServer(currentServer);
                const body = {
                    jsonrpc: "2.0",
                    method: "tools/call",
                    params: {
                        name: selectedTool.name,
                        arguments: parsedArgs
                    },
                    id: 1
                };
                setCurlCommand(generateCurlCommand(currentServer.url, headers, body));
            }

            const res = await client.request(
                {
                    method: "tools/call",
                    params: {
                        name: selectedTool.name,
                        arguments: parsedArgs
                    }
                },
                z.any()
            );
            setResult(JSON.stringify(res, null, 2));
        } catch (e: any) {
            setError(e.message);
            setResult(`Error: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    // if (status !== 'connected') {
    //     return null;
    // }

    return (
        <div className="p-4 bg-solar-base2 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-solar-base01">Tools</h2>
                <button
                    onClick={loadTools}
                    className="text-sm text-solar-blue hover:text-solar-orange hover:underline transition-colors"
                    disabled={loading}
                >
                    Refresh
                </button>
            </div>

            {loading && <p className="text-solar-base1 text-sm">Loading tools...</p>}
            {error && <p className="text-solar-red text-sm">Error: {error}</p>}

            {listCurl && <div className="mb-4"><CurlPreview command={listCurl} title="cURL Command (tools/list)" /></div>}

            {!loading && tools.length > 0 && (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-solar-base00">Select Tool</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-solar-base1 bg-solar-base3 px-3 py-2 text-sm text-solar-base00 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-solar-blue"
                            value={selectedTool?.name || ''}
                            onChange={(e) => {
                                const tool = tools.find(t => t.name === e.target.value);
                                setSelectedTool(tool || null);
                                setResult(null);
                                setArgs("{}");
                                setFormValues({});
                            }}
                        >
                            <option value="">-- Select a tool --</option>
                            {tools.map(t => (
                                <option key={t.name} value={t.name}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    {selectedTool && (
                        <div className="space-y-4 border border-solar-base2 p-4 rounded-md bg-solar-base3">
                            <p className="text-sm text-solar-base1">{selectedTool.description}</p>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-solar-base00">Arguments</label>
                                    <div className="flex items-center space-x-1 bg-solar-base2 rounded p-1">
                                        <button
                                            onClick={() => setInputMode('form')}
                                            className={`p-1 rounded ${inputMode === 'form' ? 'bg-solar-base3 text-solar-blue shadow-sm' : 'text-solar-base1 hover:text-solar-base00'}`}
                                            title="Form View"
                                        >
                                            <LayoutList className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setInputMode('json')}
                                            className={`p-1 rounded ${inputMode === 'json' ? 'bg-solar-base3 text-solar-blue shadow-sm' : 'text-solar-base1 hover:text-solar-base00'}`}
                                            title="JSON View"
                                        >
                                            <Code className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {inputMode === 'form' ? (
                                    <div className="border border-solar-base1 rounded-md p-4 bg-solar-base3">
                                        <DynamicForm
                                            schema={selectedTool.inputSchema}
                                            value={formValues}
                                            onChange={(newValues) => {
                                                setFormValues(newValues);
                                                // Sync to JSON string
                                                setArgs(JSON.stringify(newValues, null, 2));
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <textarea
                                            className="flex min-h-[200px] w-full rounded-md border border-solar-base1 bg-solar-base3 px-3 py-2 text-sm font-mono text-solar-base00 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-solar-blue"
                                            value={args}
                                            onChange={(e) => {
                                                setArgs(e.target.value);
                                                try {
                                                    setFormValues(JSON.parse(e.target.value));
                                                } catch (e) {
                                                    // Ignore parse errors while typing
                                                }
                                            }}
                                        />
                                        <p className="text-xs text-solar-base1 mt-1">
                                            Edit raw JSON arguments directly.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <Button
                                onClick={handleRunTool}
                                disabled={loading}
                            >
                                {loading ? 'Executing...' : 'Run Tool'}
                            </Button>

                            {result && (
                                <div className="space-y-2 mt-4">
                                    <label className="text-sm font-medium text-solar-base00">Result</label>
                                    <pre className="p-3 rounded-md bg-solar-base03 text-solar-base1 text-xs overflow-auto max-h-[300px] font-mono border border-solar-base02">
                                        {result}
                                    </pre>
                                </div>
                            )}

                            {curlCommand && <CurlPreview command={curlCommand} />}
                        </div>
                    )}
                </div>
            )}

            {!loading && !error && tools.length === 0 && (
                <p className="text-solar-base1 text-sm">No tools found.</p>
            )}
        </div>
    );
};
