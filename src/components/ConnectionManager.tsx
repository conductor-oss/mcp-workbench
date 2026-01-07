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

import React, { useState } from 'react';
import { useMCP } from '@/contexts/MCPContext';
import { Button } from '@/components/ui/button';
import { ServerConfig } from '@/types';
import { ServerEditor } from './ServerEditor';
import { Trash2, Edit2, Plus, Sparkles } from 'lucide-react';

// Blank template for new servers (NOT the demo server defaults)
const BLANK_SERVER_TEMPLATE: ServerConfig = {
    id: '', // Will be generated on save
    name: '',
    url: '',
    transportType: 'http-direct',
    auth: { type: 'none' },
    customHeaders: {}
};

export const ConnectionManager: React.FC<{ onShowGettingStarted?: () => void }> = ({ onShowGettingStarted }) => {
    const { status, error, isAuthRequired, servers, activeServerId, connectToServer, reauthenticateServer, disconnect, addServer, updateServer, removeServer } = useMCP();
    const [editingServer, setEditingServer] = useState<ServerConfig | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const handleConnect = async (id: string) => {
        if (activeServerId === id && status === 'connected') {
            await disconnect();
        } else {
            await connectToServer(id);
        }
    };

    const handleSave = (config: ServerConfig) => {
        if (isCreating) {
            addServer({ ...config, id: crypto.randomUUID() });
            setIsCreating(false);
        } else {
            updateServer(config);
            setEditingServer(null);
        }
    };

    if (editingServer || isCreating) {
        return (
            <ServerEditor
                config={editingServer || BLANK_SERVER_TEMPLATE}
                onSave={handleSave}
                onCancel={() => { setEditingServer(null); setIsCreating(false); }}
            />
        );
    }


    return (
        <div className="space-y-4">
            {/* Getting Started Button */}
            <button
                onClick={onShowGettingStarted}
                className="w-full py-2.5 px-3 rounded bg-[var(--header-bg)] border border-zinc-700/50 hover:border-zinc-500/50 transition-all flex items-center justify-between group shadow-lg"
            >
                <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-terminal-purple" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-terminal-text-muted group-hover:text-terminal-text transition-colors">Getting Started</span>
                </div>
                <div className="text-[10px] text-terminal-purple/40 group-hover:text-terminal-purple transition-colors font-bold uppercase">Guide</div>
            </button>

            <div className="flex justify-between items-center sticky top-0 bg-terminal-surface p-2 -mx-2 rounded z-10">
                <h2 className="text-sm font-bold uppercase tracking-wider text-terminal-text">Connections</h2>
                <Button onClick={() => setIsCreating(true)} size="sm" variant="outline" className="h-7 text-xs">
                    <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
            </div>

            <div className="space-y-2">
                {servers.map(server => (
                    <div key={server.id} className={`p-3 rounded-md flex flex-col gap-2 transition-colors ${activeServerId === server.id ? 'bg-terminal-green/10' : 'bg-terminal-surface hover:bg-terminal-surface/70'}`}>
                        <div className="flex justify-between items-center">
                            <span className="font-medium text-terminal-text">{server.name}</span>
                            <div className="flex items-center gap-1">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditingServer(server)}>
                                    <Edit2 className="w-4 h-4 text-terminal-text-muted" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => removeServer(server.id)}>
                                    <Trash2 className="w-4 h-4 text-terminal-text-muted" />
                                </Button>
                            </div>
                        </div>
                        <div className="text-xs text-terminal-text-muted font-mono truncate">{server.url} ({server.transportType})</div>
                        <Button
                            size="sm"
                            className={activeServerId === server.id && status === 'connected' ? "bg-terminal-red hover:bg-terminal-red/90 text-white" : ""}
                            onClick={() => handleConnect(server.id)}
                            disabled={status === 'connecting' || (status === 'connected' && activeServerId !== server.id)}
                        >
                            {activeServerId === server.id
                                ? (status === 'connected' ? 'Disconnect' : status === 'connecting' ? 'Connecting...' : 'Connect')
                                : 'Connect'}
                        </Button>

                        {activeServerId === server.id && isAuthRequired && server.auth?.type === 'oauth' && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-terminal-purple text-terminal-purple hover:bg-terminal-purple/10 mt-1"
                                onClick={() => {
                                    reauthenticateServer(server.id);
                                }}
                            >
                                Re-authenticate Session
                            </Button>
                        )}
                    </div>
                ))}

                {servers.length === 0 && (
                    <div className="text-sm text-terminal-text-muted text-center py-4">No servers configured.</div>
                )}
            </div>

            {error && (
                <div className="p-2 rounded-md bg-terminal-red/10 text-terminal-red text-xs break-words">
                    Error: {error}
                </div>
            )}
        </div>
    );
};
