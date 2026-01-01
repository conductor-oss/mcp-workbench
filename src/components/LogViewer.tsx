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

import React, { useEffect, useRef } from 'react';
import { useMCP } from '@/contexts/MCPContext';

export const LogViewer: React.FC = () => {
    const { logs, clearLogs } = useMCP();
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Logs are now handled globally in MCPContext via InspectableTransport

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    if (logs.length === 0) return (
        <div className="h-full flex items-center justify-center text-solar-base1 text-xs italic">No logs yet.</div>
    );

    return (
        <div className="h-full flex flex-col">
            <div className="p-2 border-b border-solar-base2 flex justify-between items-center bg-solar-base2/50">
                <h2 className="text-xs font-bold uppercase tracking-wider text-solar-base01">Connection Logs</h2>
                <button onClick={clearLogs} className="text-xs text-solar-blue hover:underline">Clear</button>
            </div>
            <div className="flex-1 overflow-auto bg-solar-base03 p-2 text-xs font-mono space-y-1">
                {logs.map((log, i) => (
                    <div key={i} className="border-b border-solar-base02 pb-1 mb-1 last:border-0">
                        <span className="text-solar-base01">[{log.timestamp}]</span>{' '}
                        <span className={log.direction === 'out' ? 'text-solar-blue' : 'text-solar-green'}>
                            {log.direction === 'out' ? '->' : '<-'}
                        </span>{' '}
                        <span className="font-bold text-solar-yellow">{log.type}</span>{' '}
                        {log.method && <span className="text-solar-violet">{log.method}</span>}
                        <div className="pl-4 text-solar-base1 break-all whitespace-pre-wrap">
                            {JSON.stringify(log.content)}
                        </div>
                    </div>
                ))}
                <div ref={logsEndRef} />
            </div>
        </div>
    );
};
