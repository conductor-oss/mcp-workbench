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
}

export const CurlPreview: React.FC<CurlPreviewProps> = ({ command, title = "cURL Command" }) => {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(command);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="border border-solar-base1 rounded-md bg-solar-base3 overflow-hidden mt-4">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex justify-between items-center p-2 bg-solar-base2 text-xs font-medium text-solar-base00 hover:bg-solar-base2/80 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Terminal className="w-3 h-3" />
                    {title}
                </div>
                <span className="text-solar-base1 text-[10px]">{open ? 'Hide' : 'Show'}</span>
            </button>

            {open && (
                <div className="relative p-3 bg-solar-base03">
                    <pre className="text-xs text-solar-base1 font-mono whitespace-pre-wrap break-all pr-8">
                        {command}
                    </pre>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 h-6 w-6 p-0 text-solar-base1 hover:text-white"
                        onClick={handleCopy}
                        title="Copy to clipboard"
                    >
                        <Copy className="w-4 h-4" />
                    </Button>
                    {copied && (
                        <div className="absolute top-2 right-10 text-[10px] text-green-400 font-medium animate-in fade-in slide-in-from-right-2">
                            Copied!
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
