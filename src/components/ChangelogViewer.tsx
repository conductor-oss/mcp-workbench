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
import ReactMarkdown from 'react-markdown';

export const ChangelogViewer: React.FC = () => {
    const [content, setContent] = useState<string>('Loading changelog...');

    useEffect(() => {
        fetch('/CHANGELOG.md')
            .then(res => res.text())
            .then(text => setContent(text))
            .catch(err => setContent(`Error loading changelog: ${err}`));
    }, []);

    return (
        <div className="prose prose-sm prose-solar max-w-none bg-terminal-bg p-6 rounded border border-terminal-border overflow-auto h-full text-terminal-text">
            <ReactMarkdown
                components={{
                    h1: ({ ...props }) => <h1 className="text-xl font-bold text-terminal-cyan mb-4 border-b border-terminal-border pb-2" {...props} />,
                    h2: ({ ...props }) => <h2 className="text-lg font-bold text-terminal-text mt-6 mb-3" {...props} />,
                    h3: ({ ...props }) => <h3 className="text-md font-bold text-terminal-text mt-4 mb-2" {...props} />,
                    ul: ({ ...props }) => <ul className="list-disc list-inside space-y-1 mb-4" {...props} />,
                    li: ({ ...props }) => <li className="text-terminal-text ml-4" {...props} />,
                    p: ({ ...props }) => <p className="mb-4 leading-relaxed" {...props} />,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};
