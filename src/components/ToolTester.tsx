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

interface Tool {
    name: string;
    description?: string;
    inputSchema: any;
}

export const ToolTester: React.FC = () => {
    const { client, status } = useMCP();
    const [tools, setTools] = useState<Tool[]>([]);
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
    const [args, setArgs] = useState<string>('{}');
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [executing, setExecuting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const executeTool = async () => {
        if (!client || !selectedTool) return;
        setExecuting(true);
        setResult(null);
        try {
            let parsedArgs = {};
            try {
                parsedArgs = JSON.parse(args);
            } catch (e) {
                throw new Error("Invalid JSON arguments");
            }

            const res = await client.request(
                {
                    method: "tools/call",
                    params: {
                        name: selectedTool.name,
                        arguments: parsedArgs
                    }
                },
                z.any() // Relaxed validation for result
            );
            setResult(JSON.stringify(res, null, 2));
        } catch (e: any) {
            setResult(`Error: ${e.message}`);
        } finally {
            setExecuting(false);
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
                                <label className="text-sm font-medium text-solar-base00">Arguments (JSON)</label>
                                <div className="relative">
                                    <textarea
                                        className="flex min-h-[100px] w-full rounded-md border border-solar-base1 bg-solar-base3 px-3 py-2 text-sm font-mono text-solar-base00 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-solar-blue"
                                        value={args}
                                        onChange={(e) => setArgs(e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-solar-base1">
                                    Expected schema: {JSON.stringify(selectedTool.inputSchema)}
                                </p>
                            </div>

                            <Button
                                onClick={executeTool}
                                disabled={executing}
                            >
                                {executing ? 'Executing...' : 'Run Tool'}
                            </Button>

                            {result && (
                                <div className="space-y-2 mt-4">
                                    <label className="text-sm font-medium text-solar-base00">Result</label>
                                    <pre className="p-3 rounded-md bg-solar-base03 text-solar-base1 text-xs overflow-auto max-h-[300px] font-mono border border-solar-base02">
                                        {result}
                                    </pre>
                                </div>
                            )}
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
