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

interface Prompt {
    name: string;
    description?: string;
    arguments?: {
        name: string;
        description?: string;
        required?: boolean;
    }[];
}

import { CurlPreview } from './CurlPreview';

export const PromptTester: React.FC = () => {
    const { client, status, servers, activeServerId } = useMCP();
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
    const [args, setArgs] = useState<Record<string, string>>({});
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [executing, setExecuting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [curlCommand, setCurlCommand] = useState<string | null>(null);
    const [listCurl, setListCurl] = useState<string | null>(null);
    const [resultTab, setResultTab] = useState<'result' | 'curl'>('result');

    useEffect(() => {
        if (status === 'connected' && client) {
            loadPrompts();
        } else {
            setPrompts([]);
            setSelectedPrompt(null);
        }
    }, [status, client]);

    const loadPrompts = async () => {
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
                    method: "prompts/list",
                    id: 1
                };
                setListCurl(generateCurlCommand(currentServer.url, headers, body));
            }

            const result = await client.request(
                { method: "prompts/list" },
                z.object({ prompts: z.array(z.any()) })
            );
            // @ts-ignore
            setPrompts(result.prompts || []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const executePrompt = async () => {
        if (!client || !selectedPrompt) return;
        setExecuting(true);
        setResult(null);
        setError(null);
        try {
            // Generate cURL
            const currentServer = servers.find(s => s.id === activeServerId);
            if (currentServer) {
                const { generateCurlCommand, getHeadersForServer } = await import('@/lib/curlGenerator');
                const headers = getHeadersForServer(currentServer);
                const body = {
                    jsonrpc: "2.0",
                    method: "prompts/get",
                    params: {
                        name: selectedPrompt.name,
                        arguments: args
                    },
                    id: 1
                };
                setCurlCommand(generateCurlCommand(currentServer.url, headers, body));
            }

            const res = await client.request(
                {
                    method: "prompts/get",
                    params: {
                        name: selectedPrompt.name,
                        arguments: args
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
            setExecuting(false);
        }
    };

    // if (status !== 'connected') {
    //     return null;
    // }

    return (
        <div className="p-4 bg-terminal-surface rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-terminal-text">Prompts</h2>
                <button
                    onClick={loadPrompts}
                    className="text-sm text-terminal-cyan hover:text-terminal-amber hover:underline transition-colors"
                    disabled={loading}
                >
                    Refresh
                </button>
            </div>

            {loading && <p className="text-terminal-text-muted text-sm">Loading prompts...</p>}
            {error && <p className="text-terminal-red text-sm">Error: {error}</p>}

            {listCurl && <div className="mb-4"><CurlPreview command={listCurl} title="cURL Command (prompts/list)" /></div>}

            {!loading && prompts.length > 0 && (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-terminal-text">Select Prompt</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-zinc-600 bg-terminal-bg px-3 py-2 text-sm text-terminal-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-cyan"
                            value={selectedPrompt?.name || ''}
                            onChange={(e) => {
                                const prompt = prompts.find(p => p.name === e.target.value);
                                setSelectedPrompt(prompt || null);
                                setArgs({});
                                setResult(null);
                                setResultTab('result');
                            }}
                        >
                            <option value="">-- Select a prompt --</option>
                            {prompts.map(p => (
                                <option key={p.name} value={p.name}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {selectedPrompt && (
                        <div className="space-y-4 p-4 rounded-md bg-terminal-surface/20">
                            <p className="text-sm text-terminal-text-muted">{selectedPrompt.description}</p>

                            {selectedPrompt.arguments && selectedPrompt.arguments.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-terminal-text">Arguments</h3>
                                    {selectedPrompt.arguments.map(arg => (
                                        <div key={arg.name} className="space-y-1">
                                            <label className="text-xs font-medium text-terminal-text-muted">
                                                {arg.name} {arg.required ? '*' : ''}
                                            </label>
                                            <input
                                                className="flex h-8 w-full rounded-md border border-zinc-600 bg-terminal-bg px-3 py-1 text-sm shadow-sm transition-colors text-terminal-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-cyan"
                                                value={args[arg.name] || ''}
                                                onChange={(e) => setArgs({ ...args, [arg.name]: e.target.value })}
                                                placeholder={arg.description}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <Button
                                onClick={executePrompt}
                                disabled={executing}
                            >
                                {executing ? 'Getting Prompt...' : 'Get Prompt'}
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
                                                    <pre className="p-4 rounded-md bg-terminal-surface text-terminal-text-muted text-xs font-mono border border-zinc-700/50 overflow-auto max-h-[400px]">
                                                        {result}
                                                    </pre>
                                                </div>
                                            ) : (
                                                <div className="py-8 text-center text-xs text-terminal-text-muted italic bg-terminal-surface/10 rounded-md border border-dashed border-zinc-700/30">
                                                    No results to display. Execute prompt to see output.
                                                </div>
                                            )
                                        ) : (
                                            curlCommand ? (
                                                <CurlPreview command={curlCommand} allowToggle={false} />
                                            ) : (
                                                <div className="py-8 text-center text-xs text-terminal-text-muted italic bg-terminal-surface/10 rounded-md border border-dashed border-zinc-700/30">
                                                    No cURL command available. Execute prompt to generate it.
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

            {!loading && !error && prompts.length === 0 && (
                <p className="text-terminal-text-muted text-sm">No prompts found.</p>
            )}
        </div>
    );
};
