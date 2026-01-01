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

export const PromptTester: React.FC = () => {
    const { client, status } = useMCP();
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
    const [args, setArgs] = useState<Record<string, string>>({});
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [executing, setExecuting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
        try {
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
                <h2 className="text-lg font-semibold text-solar-base01">Prompts</h2>
                <button
                    onClick={loadPrompts}
                    className="text-sm text-solar-blue hover:text-solar-orange hover:underline transition-colors"
                    disabled={loading}
                >
                    Refresh
                </button>
            </div>

            {loading && <p className="text-solar-base1 text-sm">Loading prompts...</p>}
            {error && <p className="text-solar-red text-sm">Error: {error}</p>}

            {!loading && prompts.length > 0 && (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-solar-base00">Select Prompt</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-solar-base1 bg-solar-base3 px-3 py-2 text-sm text-solar-base00 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-solar-blue"
                            value={selectedPrompt?.name || ''}
                            onChange={(e) => {
                                const prompt = prompts.find(p => p.name === e.target.value);
                                setSelectedPrompt(prompt || null);
                                setArgs({});
                                setResult(null);
                            }}
                        >
                            <option value="">-- Select a prompt --</option>
                            {prompts.map(p => (
                                <option key={p.name} value={p.name}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {selectedPrompt && (
                        <div className="space-y-4 border border-solar-base2 p-4 rounded-md bg-solar-base3">
                            <p className="text-sm text-solar-base1">{selectedPrompt.description}</p>

                            {selectedPrompt.arguments && selectedPrompt.arguments.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-solar-base00">Arguments</h3>
                                    {selectedPrompt.arguments.map(arg => (
                                        <div key={arg.name} className="space-y-1">
                                            <label className="text-xs font-medium text-solar-base1">
                                                {arg.name} {arg.required ? '*' : ''}
                                            </label>
                                            <input
                                                className="flex h-8 w-full rounded-md border border-solar-base1 bg-solar-base3 px-3 py-1 text-sm shadow-sm transition-colors text-solar-base00 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-solar-blue"
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

            {!loading && !error && prompts.length === 0 && (
                <p className="text-solar-base1 text-sm">No prompts found.</p>
            )}
        </div>
    );
};
