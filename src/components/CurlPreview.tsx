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
import { Button } from '@/components/ui/button';
import { Copy, Terminal } from 'lucide-react';

interface CurlPreviewProps {
    command: string;
    title?: string;
    allowToggle?: boolean;
}

export const CurlPreview: React.FC<CurlPreviewProps> = ({ command, title = "cURL Command", allowToggle = true }) => {
    const [open, setOpen] = useState(!allowToggle);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(command);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="rounded-md overflow-hidden mt-4">
            <div
                className={`flex justify-between items-center px-3 py-1.5 bg-terminal-surface/30 border-b border-zinc-700/50 ${allowToggle ? 'cursor-pointer hover:bg-terminal-surface/50 transition-colors' : ''}`}
                onClick={allowToggle ? () => setOpen(!open) : undefined}
            >
                <div className="flex items-center gap-2 text-[10px] font-bold text-terminal-text-muted uppercase tracking-wider">
                    <Terminal className="w-3 h-3" />
                    {title}
                </div>
                <div className="flex items-center gap-2">
                    {allowToggle && (
                        <span className="text-terminal-text-muted text-[10px] mr-2 lowercase font-normal italic">
                            {open ? 'Hide' : 'Show'}
                        </span>
                    )}
                    {copied && (
                        <span className="text-[10px] text-green-400 font-medium animate-in fade-in slide-in-from-right-2">
                            Copied!
                        </span>
                    )}
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-terminal-text-muted hover:text-white"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleCopy();
                        }}
                        title="Copy to clipboard"
                    >
                        <Copy className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>

            {open && (
                <div className="p-4 bg-terminal-surface/20 border border-t-0 border-zinc-700/30 rounded-b-md">
                    <pre className="text-xs text-terminal-text-muted font-mono whitespace-pre-wrap break-all">
                        {command}
                    </pre>
                </div>
            )}
        </div>
    );
};
