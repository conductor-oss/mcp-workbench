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

import { useState } from 'react';
import { MCPProvider } from '@/contexts/MCPContext';
import { ConnectionManager } from '@/components/ConnectionManager';
import { ResourceExplorer } from '@/components/ResourceExplorer';
import { ToolTester } from '@/components/ToolTester';
import { PromptTester } from '@/components/PromptTester';
import { LogViewer } from '@/components/LogViewer';
import { ChangelogViewer } from '@/components/ChangelogViewer';
import { OAuthCallbackHandler } from "@/components/OAuthCallbackHandler";
import { Database, Wrench, MessageSquare, Terminal, Github, Slack, Sparkles } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<'resources' | 'tools' | 'prompts' | 'changelog'>('resources');
  const [showLogs, setShowLogs] = useState(true);

  return (
    <MCPProvider>
      <div className="h-screen w-screen bg-solar-base3 text-solar-base00 flex flex-col overflow-hidden font-sans">
        <OAuthCallbackHandler />

        {/* Header */}
        <header className="h-12 border-b border-solar-base2 bg-solar-base3 flex items-center px-4 shrink-0 justify-between">
          <div className="flex items-center gap-2">
            <img src="/favicon.ico" alt="Orkes Logo" className="w-6 h-6 object-contain" />
            <h1 className="font-bold text-solar-base01">MCP Workbench</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <a
                href="https://join.slack.com/t/orkes-conductor/shared_invite/zt-3dpcskdyd-W895bJDm8psAV7viYG3jFA"
                target="_blank"
                rel="noopener noreferrer"
                className="text-solar-base1 hover:text-solar-blue transition-colors flex items-center gap-1.5 text-xs font-bold"
              >
                <Slack className="w-4 h-4" />
                <span>Slack</span>
              </a>
              <a
                href="https://github.com/conductor-oss/mcp-workbench"
                target="_blank"
                rel="noopener noreferrer"
                className="text-solar-base1 hover:text-solar-blue transition-colors flex items-center gap-1.5 text-xs font-bold"
              >
                <Github className="w-4 h-4" />
                <span>Github</span>
              </a>
              <div className="w-px h-4 bg-solar-base2 mx-1" />
              <a
                href="https://modelcontextprotocol.io/docs/getting-started/intro"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity flex items-center"
                title="Model Context Protocol Documentation"
              >
                <img src="/mcp.svg" alt="MCP Logo" className="w-5 h-5 object-contain" />
              </a>
            </div>
            <div className="text-[10px] text-solar-base1 bg-solar-base2 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">v1.0.0</div>
          </div>
        </header>

        {/* Main Workspace */}
        <div className="flex-1 flex overflow-hidden">

          {/* Sidebar: Connection Manager */}
          <aside className="w-80 border-r border-solar-base2 bg-solar-base2/30 flex flex-col shrink-0">
            <div className="p-4 overflow-y-auto flex-1">
              <ConnectionManager />
            </div>
          </aside>

          {/* Central Content */}
          <main className="flex-1 flex flex-col min-w-0 bg-solar-base3">

            {/* Tabs / Toolbar */}
            <div className="h-10 border-b border-solar-base2 flex items-center px-4 gap-4 bg-solar-base2/10">
              <button
                onClick={() => setActiveTab('resources')}
                className={`flex items-center gap-2 h-full px-2 border-b-2 transition-colors text-sm font-medium ${activeTab === 'resources' ? 'border-solar-blue text-solar-blue' : 'border-transparent text-solar-base01 hover:text-solar-blue'}`}
              >
                <Database className="w-4 h-4" /> Resources
              </button>
              <button
                onClick={() => setActiveTab('tools')}
                className={`flex items-center gap-2 h-full px-2 border-b-2 transition-colors text-sm font-medium ${activeTab === 'tools' ? 'border-solar-blue text-solar-blue' : 'border-transparent text-solar-base01 hover:text-solar-blue'}`}
              >
                <Wrench className="w-4 h-4" /> Tools
              </button>
              <button
                onClick={() => setActiveTab('prompts')}
                className={`flex items-center gap-2 h-full px-2 border-b-2 transition-colors text-sm font-medium ${activeTab === 'prompts' ? 'border-solar-blue text-solar-blue' : 'border-transparent text-solar-base01 hover:text-solar-blue'}`}
              >
                <MessageSquare className="w-4 h-4" /> Prompts
              </button>

              <div className="flex-1" />

              <button
                onClick={() => setActiveTab('changelog')}
                className={`flex items-center gap-2 h-full px-2 border-b-2 transition-colors text-sm font-medium ${activeTab === 'changelog' ? 'border-solar-magenta text-solar-magenta' : 'border-transparent text-solar-base01 hover:text-solar-magenta'}`}
              >
                <Sparkles className="w-4 h-4" /> What's new
              </button>

              <div className="w-px h-4 bg-solar-base2 mx-2" />

              <button
                onClick={() => setShowLogs(!showLogs)}
                className={`flex items-center gap-2 text-xs font-medium px-2 py-1 rounded transition-colors ${showLogs ? 'bg-solar-base2 text-solar-base01' : 'text-solar-base1 hover:text-solar-base00'}`}
              >
                <Terminal className="w-3 h-3" /> Logs
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto p-4">
              {activeTab === 'resources' && <ResourceExplorer />}
              {activeTab === 'tools' && <ToolTester />}
              {activeTab === 'prompts' && <PromptTester />}
              {activeTab === 'changelog' && <ChangelogViewer />}
            </div>

            {/* Bottom Panel: Logs */}
            {showLogs && (
              <div className="h-64 border-t border-solar-base2 bg-solar-base2/20 flex flex-col shrink-0 transition-all">
                {/* LogViewer handles its own internal layout, but we need to ensure it fits nicely */}
                <div className="flex-1 overflow-hidden p-0">
                  {/* We might need to adjust LogViewer slightly to remove its hardcoded height if we wrap it here */}
                  <LogViewer />
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Footer */}
        <footer className="h-8 border-t border-solar-base2 bg-solar-base3 flex items-center justify-center px-4 shrink-0">
          <a
            href="https://orkes.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-solar-base1 hover:text-solar-blue transition-colors uppercase tracking-widest font-bold flex items-center gap-1"
          >
            powered by <span className="text-solar-blue">orkes.io</span>
          </a>
        </footer>
      </div>
    </MCPProvider>
  )
}

export default App
