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
    const [resultTab, setResultTab] = useState<'result' | 'curl'>('result');

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
            setResultTab('result');
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
        <div className="p-4 bg-terminal-surface rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-terminal-text">Tools</h2>
                <button
                    onClick={loadTools}
                    className="text-sm text-terminal-cyan hover:text-terminal-amber hover:underline transition-colors"
                    disabled={loading}
                >
                    Refresh
                </button>
            </div>

            {loading && <p className="text-terminal-text-muted text-sm">Loading tools...</p>}
            {error && <p className="text-terminal-red text-sm">Error: {error}</p>}

            {listCurl && <div className="mb-4"><CurlPreview command={listCurl} title="cURL Command (tools/list)" /></div>}

            {!loading && tools.length > 0 && (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-terminal-text">Select Tool</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-zinc-600 bg-terminal-bg px-3 py-2 text-sm text-terminal-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-cyan"
                            value={selectedTool?.name || ''}
                            onChange={(e) => {
                                const tool = tools.find(t => t.name === e.target.value);
                                setSelectedTool(tool || null);
                                setArgs("{}");
                                setFormValues({});
                                setResult(null);
                                setResultTab('result');
                            }}
                        >
                            <option value="">-- Select a tool --</option>
                            {tools.map(t => (
                                <option key={t.name} value={t.name}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    {selectedTool && (
                        <div className="space-y-4 p-4 rounded-md bg-terminal-surface/20">
                            <p className="text-sm text-terminal-text-muted">{selectedTool.description}</p>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-terminal-text">Arguments</label>
                                    <div className="flex items-center space-x-1 bg-terminal-surface rounded p-1">
                                        <button
                                            onClick={() => setInputMode('form')}
                                            className={`p-1 rounded ${inputMode === 'form' ? 'bg-terminal-bg text-terminal-cyan shadow-sm' : 'text-terminal-text-muted hover:text-terminal-text'}`}
                                            title="Form View"
                                        >
                                            <LayoutList className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setInputMode('json')}
                                            className={`p-1 rounded ${inputMode === 'json' ? 'bg-terminal-bg text-terminal-cyan shadow-sm' : 'text-terminal-text-muted hover:text-terminal-text'}`}
                                            title="JSON View"
                                        >
                                            <Code className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {inputMode === 'form' ? (
                                    <div className="pt-2 bg-transparent">
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
                                            className="flex min-h-[200px] w-full rounded-md border border-zinc-600 bg-terminal-bg px-3 py-2 text-sm font-mono text-terminal-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-cyan"
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
                                        <p className="text-xs text-terminal-text-muted mt-1">
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

                            {(result || curlCommand) && (
                                <div className="space-y-4 mt-6 pt-4 border-t border-zinc-700/50">
                                    <div className="flex gap-6 border-b border-zinc-700/50">
                                        <button
                                            onClick={() => setResultTab('result')}
                                            className={`pb-2 text-sm font-bold transition-all ${resultTab === 'result' ? 'border-b-2 border-terminal-cyan text-terminal-cyan' : 'text-terminal-text-muted hover:text-terminal-text'}`}
                                        >
                                            RESULT
                                        </button>
                                        <button
                                            onClick={() => setResultTab('curl')}
                                            className={`pb-2 text-sm font-bold transition-all ${resultTab === 'curl' ? 'border-b-2 border-terminal-cyan text-terminal-cyan' : 'text-terminal-text-muted hover:text-terminal-text'}`}
                                        >
                                            CURL
                                        </button>
                                    </div>

                                    <div className="mt-2">
                                        {resultTab === 'result' ? (
                                            result ? (
                                                <div className="space-y-2">
                                                    <pre className="p-4 rounded-md bg-terminal-surface/30 text-terminal-text-muted text-xs font-mono border border-zinc-700/50 overflow-auto max-h-[400px]">
                                                        {result}
                                                    </pre>
                                                </div>
                                            ) : (
                                                <div className="py-8 text-center text-xs text-terminal-text-muted italic bg-terminal-surface/10 rounded-md border border-dashed border-zinc-700/30">
                                                    No results to display. Run the tool to see output.
                                                </div>
                                            )
                                        ) : (
                                            curlCommand ? (
                                                <CurlPreview command={curlCommand} allowToggle={false} />
                                            ) : (
                                                <div className="py-8 text-center text-xs text-terminal-text-muted italic bg-terminal-surface/10 rounded-md border border-dashed border-zinc-700/30">
                                                    No cURL command available. Run the tool to generate it.
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {!loading && !error && tools.length === 0 && (
                <p className="text-terminal-text-muted text-sm">No tools found.</p>
            )}
        </div>
    );
};
