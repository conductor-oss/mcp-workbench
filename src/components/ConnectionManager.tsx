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
import { ServerConfig, DEFAULT_SERVER_CONFIG } from '@/types';
import { ServerEditor } from './ServerEditor';
import { Trash2, Edit2, Plus } from 'lucide-react';

export const ConnectionManager: React.FC = () => {
    const { status, error, servers, activeServerId, connectToServer, disconnect, addServer, updateServer, removeServer } = useMCP();
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
                config={editingServer || DEFAULT_SERVER_CONFIG}
                onSave={handleSave}
                onCancel={() => { setEditingServer(null); setIsCreating(false); }}
            />
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center sticky top-0 bg-solar-base2 p-2 -mx-2 rounded z-10">
                <h2 className="text-sm font-bold uppercase tracking-wider text-solar-base01">Connections</h2>
                <Button onClick={() => setIsCreating(true)} size="sm" variant="outline" className="h-7 text-xs">
                    <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
            </div>

            <div className="space-y-2">
                {servers.map(server => (
                    <div key={server.id} className={`p-3 rounded-md border flex flex-col gap-2 transition-colors ${activeServerId === server.id ? 'border-solar-green bg-solar-green/10' : 'bg-solar-base3 border-solar-base2 hover:border-solar-base1'}`}>
                        <div className="flex justify-between items-center">
                            <span className="font-medium text-solar-base00">{server.name}</span>
                            <div className="flex items-center gap-1">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditingServer(server)}>
                                    <Edit2 className="w-4 h-4 text-solar-base1" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => removeServer(server.id)}>
                                    <Trash2 className="w-4 h-4 text-solar-base1" />
                                </Button>
                            </div>
                        </div>
                        <div className="text-xs text-solar-base1 font-mono truncate">{server.url} ({server.transportType})</div>
                        <Button
                            size="sm"
                            className={activeServerId === server.id && status === 'connected' ? "bg-solar-red hover:bg-solar-red/90 text-white" : ""}
                            onClick={() => handleConnect(server.id)}
                            disabled={status === 'connecting' || (status === 'connected' && activeServerId !== server.id)}
                        >
                            {activeServerId === server.id
                                ? (status === 'connected' ? 'Disconnect' : status === 'connecting' ? 'Connecting...' : 'Connect')
                                : 'Connect'}
                        </Button>
                    </div>
                ))}

                {servers.length === 0 && (
                    <div className="text-sm text-solar-base1 text-center py-4">No servers configured.</div>
                )}
            </div>

            {error && (
                <div className="p-2 rounded-md bg-solar-red/10 text-solar-red text-xs break-words">
                    Error: {error}
                </div>
            )}
        </div>
    );
};
