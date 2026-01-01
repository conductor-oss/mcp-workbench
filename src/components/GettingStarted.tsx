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

import React from 'react';
import { Rocket, Key, Shield, AlertTriangle, Code, Globe } from 'lucide-react';

export const GettingStarted: React.FC = () => {
    return (
        <div className="p-6 space-y-8 overflow-auto h-full">
            {/* Quick Start */}
            <Section icon={<Rocket className="w-5 h-5" />} title="Quick Start">
                <div className="bg-terminal-cyan/10 border border-terminal-cyan p-4 rounded-lg mb-4">
                    <p className="font-bold text-terminal-cyan mb-2 text-sm">🎯 Try Demo Mode!</p>
                    <p className="text-xs text-terminal-text mb-2">
                        Test the workbench immediately with our built-in demo server (no setup required):
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-xs text-terminal-text ml-4">
                        <li>Look for <strong>"🎯 Demo Server (Try Me!)"</strong> in the left sidebar</li>
                        <li>Click <strong>Connect</strong></li>
                        <li>Explore tools, prompts, and resources - all running in your browser!</li>
                    </ol>
                </div>

                <p className="text-xs font-bold text-terminal-text mb-2">Or connect to your own server:</p>
                <ol className="list-decimal list-inside space-y-2 text-xs text-terminal-text">
                    <li>Click <strong>+ Add Server</strong> in the left sidebar.  Enter your MCP server URL (e.g., <code className="bg-terminal-surface px-2 py-0.5 rounded text-[11px]">https://api.example.com/mcp</code>)</li>
                    <li>Add authentication if required (see below)</li>
                    <li>Click <strong>Connect</strong> and start testing!</li>
                </ol>
            </Section>

            {/* CORS Configuration */}
            <Section icon={<Globe className="w-5 h-5" />} title="CORS Configuration (Required!)">
                <div className="bg-terminal-amber/10 border border-terminal-amber p-4 rounded-lg mb-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-terminal-amber flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-terminal-amber mb-1">Your MCP server MUST send these headers:</p>
                            <pre className="bg-terminal-surface p-2 rounded text-xs font-mono text-terminal-text-muted mt-2">
                                {`Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key`}
                            </pre>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                    <details className="bg-terminal-bg p-3 rounded-lg border border-terminal-border">
                        <summary className="font-bold text-terminal-text cursor-pointer text-sm">Node.js / Express</summary>
                        <pre className="bg-terminal-surface p-2 rounded mt-2 text-xs font-mono text-terminal-text-muted overflow-x-auto">
                            {`app.use(cors({
  origin: '*',
  methods: ['POST', 'OPTIONS']
}));`}
                        </pre>
                    </details>

                    <details className="bg-terminal-bg p-3 rounded-lg border border-terminal-border">
                        <summary className="font-bold text-terminal-text cursor-pointer text-sm">Python / Flask</summary>
                        <pre className="bg-terminal-surface p-2 rounded mt-2 text-xs font-mono text-terminal-text-muted overflow-x-auto">
                            {`CORS(app, resources={
  r"/*": {"origins": "*"}
})`}
                        </pre>
                    </details>
                </div>
            </Section>

            {/* Authentication */}
            <Section icon={<Shield className="w-5 h-5" />} title="Authentication">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-terminal-bg p-4 rounded-lg border border-terminal-border">
                        <h4 className="font-bold text-terminal-text mb-2 flex items-center gap-2 text-sm">
                            <Key className="w-4 h-4 text-terminal-cyan" />
                            API Key
                        </h4>
                        <p className="text-sm text-terminal-text-muted mb-2">For servers requiring API keys:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-terminal-text">
                            <li>Select <strong>API Key</strong> auth type</li>
                            <li>Enter header name (e.g., <code className="bg-terminal-surface px-1 rounded text-xs">X-API-Key</code>)</li>
                            <li>Paste your API key</li>
                        </ul>
                    </div>

                    <div className="bg-terminal-bg p-4 rounded-lg border border-terminal-border">
                        <h4 className="font-bold text-terminal-text mb-2 flex items-center gap-2 text-sm">
                            <Shield className="w-4 h-4 text-terminal-cyan" />
                            OAuth 2.0
                        </h4>
                        <p className="text-sm text-terminal-text-muted mb-2">For OAuth-protected servers:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-terminal-text">
                            <li>Select <strong>OAuth</strong> auth type</li>
                            <li>Enter OAuth URLs and Client ID</li>
                            <li>Click <strong>Authenticate</strong></li>
                            <li>Token auto-refreshes on 401</li>
                        </ul>
                    </div>
                </div>
            </Section>

            {/* Troubleshooting */}
            <Section icon={<Code className="w-5 h-5" />} title="Common Issues">
                <div className="space-y-2">
                    <TroubleshootItem
                        problem="CORS error / Access-Control-Allow-Origin"
                        solution="Your server is missing CORS headers. See CORS Configuration above."
                    />
                    <TroubleshootItem
                        problem="401 Unauthorized"
                        solution="Check authentication. For OAuth, click 'Re-authenticate Session'."
                    />
                    <TroubleshootItem
                        problem="Connection refused"
                        solution="Verify your MCP server is running and accessible at the configured URL."
                    />
                    <TroubleshootItem
                        problem="Mixed Content (HTTPS → HTTP)"
                        solution="Use npm run dev locally, or deploy your MCP server with HTTPS."
                    />
                </div>
            </Section>

            {/* Safari Issues - Moved to bottom */}
            <Section icon={<AlertTriangle className="w-5 h-5" />} title="Safari-Specific Issues">
                <div className="bg-terminal-red/10 border border-terminal-red p-4 rounded-lg">
                    <p className="text-xs text-terminal-text mb-2">
                        <strong className="text-terminal-red">Safari requires an additional CORS header</strong> for localhost:
                    </p>
                    <pre className="bg-terminal-surface p-2 rounded text-[10px] font-mono text-terminal-text-muted">
                        Access-Control-Allow-Private-Network: true
                    </pre>
                    <p className="text-[11px] text-terminal-text-muted mt-2">
                        Add this to your server's CORS middleware. Chrome and Firefox are more permissive.
                    </p>
                </div>
            </Section>

            {/* Next Steps */}
            <div className="bg-terminal-cyan/10 border border-terminal-cyan p-4 rounded-lg text-center">
                <p className="text-terminal-text">
                    <strong>Ready?</strong> Add your first server in the left sidebar and explore the tabs! 🚀
                </p>
            </div>
        </div>
    );
};

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <section className="space-y-4">
        <h2 className="text-lg font-bold text-terminal-text flex items-center gap-2 border-b border-terminal-border pb-2 uppercase tracking-wide">
            {icon}
            {title}
        </h2>
        {children}
    </section>
);

const TroubleshootItem: React.FC<{ problem: string; solution: string }> = ({ problem, solution }) => (
    <div className="bg-terminal-bg p-3 rounded-lg border border-terminal-border">
        <p className="font-bold text-terminal-text text-xs mb-1">❌ {problem}</p>
        <p className="text-xs text-terminal-text-muted">✅ {solution}</p>
    </div>
);
