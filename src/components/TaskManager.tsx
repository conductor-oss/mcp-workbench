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
import { Loader2, RefreshCw, ClipboardList } from 'lucide-react';

interface Task {
    name: string;
    description?: string;
    parameters?: any; // Input schema for creating a task (optional)
}

import { CurlPreview } from './CurlPreview';

interface TaskExecution {
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress?: number;
    result?: string;
    curl?: string;
}

export const TaskManager: React.FC = () => {
    const { client, status, servers, activeServerId } = useMCP();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    // Execution State
    const [executions, setExecutions] = useState<TaskExecution[]>([]);
    const [listCurl, setListCurl] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'connected' && client) {
            loadTasks();
        } else {
            setTasks([]);
        }
    }, [status, client]);

    const loadTasks = async () => {
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
                    method: "tasks/list",
                    id: 1
                };
                setListCurl(generateCurlCommand(currentServer.url, headers, body));
            }

            // Note: 'tasks/list' is experimental/utility. 
            // We use generic request.
            const result = await client.request(
                { method: "tasks/list" },
                z.object({ tasks: z.array(z.any()) })
            );
            // @ts-ignore
            setTasks(result.tasks || []);
        } catch (e: any) {
            console.warn("Failed to load tasks (server might not support it)", e);
            // Don't show error to user prominently if it's just not supported, maybe empty list?
            // Actually, showing the error helps debug.
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    // Note: The spec is vague on how to START a task. 
    // Usually it's via a tool call that returns a taskId, OR a specific endpoint.
    // The user mentioned "list, get, poll, update".
    // I will assume for now there isn't a generic "tasks/run" unless the task list provides it.
    // IF the task list provides names, maybe we call `tasks/execute`?
    // Let's implement a generic "Execute Task" assuming `tools/call` style but for tasks?
    // Or maybe `completion/complete`?

    // Update: If the user says "augmented tools", it implies TOOLS return tasks.
    // But they also said "list, get, poll".
    // Let's focus on LIST and GET/POLL of existing tasks.
    // I'll add a section to "Poll Task ID".

    const pollTask = async (taskId: string) => {
        if (!client) return;
        try {
            // Generate cURL
            const currentServer = servers.find(s => s.id === activeServerId);
            let cmd = '';
            if (currentServer) {
                const { generateCurlCommand, getHeadersForServer } = await import('@/lib/curlGenerator');
                const headers = getHeadersForServer(currentServer);
                const body = {
                    jsonrpc: "2.0",
                    method: "tasks/get",
                    params: { taskId },
                    id: 1
                };
                cmd = generateCurlCommand(currentServer.url, headers, body);
            }

            // tasks/get? or tasks/status?
            const result = await client.request(
                { method: "tasks/get", params: { taskId } },
                z.any()
            );
            console.log("Task Get Result:", result);
            // Update executions list
            // @ts-ignore
            const status = result.status || 'unknown';
            setExecutions(prev => {
                const existing = prev.find(e => e.id === taskId);
                if (existing) {
                    return prev.map(e => e.id === taskId ? { ...e, status, result: JSON.stringify(result), curl: cmd } : e);
                }
                return [...prev, { id: taskId, status, result: JSON.stringify(result), curl: cmd }];
            });
        } catch (e: any) {
            setError(`Failed to poll task: ${e.message}`);
        }
    };

    return (
        <div className="p-4 bg-solar-base2 rounded-lg shadow-sm h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-solar-base01">Tasks Utility</h2>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={loadTasks}
                    disabled={loading}
                    className="text-solar-blue"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh List
                </Button>
            </div>

            {error && (
                <div className="bg-solar-red/10 border border-solar-red text-solar-red p-3 rounded mb-4 text-sm">
                    Error loading tasks: {error}
                </div>
            )}

            {listCurl && <div className="mb-4"><CurlPreview command={listCurl} title="cURL Command (tasks/list)" /></div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                {/* Left: Task Definitions */}
                <div className="bg-solar-base3 rounded p-4 border border-solar-base1 overflow-auto">
                    <h3 className="font-medium text-solar-base00 mb-3 flex items-center gap-2">
                        <ClipboardList className="w-4 h-4" /> Available Tasks
                    </h3>
                    {tasks.length === 0 ? (
                        <p className="text-sm text-solar-base1">No tasks found or not supported.</p>
                    ) : (
                        <div className="space-y-2">
                            {tasks.map((task, idx) => (
                                <div key={idx} className="p-3 border border-solar-base2 rounded bg-solar-base2/20">
                                    <div className="font-medium text-solar-base01">{task.name}</div>
                                    <div className="text-xs text-solar-base1 mt-1">{task.description}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Task Inspector / Poller */}
                <div className="bg-solar-base3 rounded p-4 border border-solar-base1 overflow-auto">
                    <h3 className="font-medium text-solar-base00 mb-3 flex items-center gap-2">
                        <Loader2 className="w-4 h-4" /> Task Inspector
                    </h3>

                    {/* Manual Poll Input */}
                    <div className="flex gap-2 mb-6">
                        <input
                            type="text"
                            placeholder="Enter Task ID"
                            className="flex-1 rounded-md border border-solar-base1 bg-solar-base3 px-3 py-2 text-sm text-solar-base00"
                            id="manual-task-id"
                        />
                        <Button
                            size="sm"
                            onClick={() => {
                                // @ts-ignore
                                const val = document.getElementById('manual-task-id').value;
                                if (val) pollTask(val);
                            }}
                        >
                            Poll
                        </Button>
                    </div>

                    {/* Execution List */}
                    <div className="space-y-4">
                        {executions.map(exec => (
                            <div key={exec.id} className="p-3 border border-solar-base2 rounded bg-solar-base2/10">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-mono text-xs font-bold text-solar-base01">{exec.id}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${exec.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        exec.status === 'failed' ? 'bg-red-100 text-red-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                        {exec.status}
                                    </span>
                                </div>
                                <pre className="text-xs text-solar-base1 overflow-auto max-h-[100px] bg-solar-base2/50 p-2 rounded">
                                    {exec.result}
                                </pre>
                                <div className="mt-2 flex justify-end">
                                    <Button size="sm" variant="ghost" onClick={() => pollTask(exec.id)}>
                                        <RefreshCw className="w-3 h-3 mr-1" /> Update
                                    </Button>
                                </div>
                                {exec.curl && <CurlPreview command={exec.curl} title="cURL" />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
