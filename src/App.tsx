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

import { useState, useEffect } from 'react';
import { MCPProvider } from '@/contexts/MCPContext';
import { ConnectionManager } from '@/components/ConnectionManager';
import { ResourceExplorer } from '@/components/ResourceExplorer';
import { ToolTester } from '@/components/ToolTester';
import { PromptTester } from '@/components/PromptTester';
import { TaskManager } from '@/components/TaskManager';
import { LogViewer } from '@/components/LogViewer';
import { ChangelogViewer } from '@/components/ChangelogViewer';
import { LearnMCP } from '@/components/LearnMCP';
import { GettingStarted } from '@/components/GettingStarted';
import { OAuthCallbackHandler } from "@/components/OAuthCallbackHandler";
import { useTheme } from '@/contexts/ThemeContext';
import { MCPIcon } from '@/components/icons/MCPIcon';
import { Database, Wrench, MessageSquare, Terminal, Github, Slack, Sparkles, GraduationCap, ClipboardList, X, Sun, Moon } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<'tools' | 'prompts' | 'tasks' | 'resources' | 'changelog' | 'learn'>('tools');
  const [showLogs, setShowLogs] = useState(true);
  const [showGettingStarted, setShowGettingStarted] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showGettingStarted) {
        setShowGettingStarted(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showGettingStarted]);

  const switchToTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === 'learn' || tab === 'changelog') {
      setShowLogs(false);
    }
  };

  return (
    <MCPProvider>
      <div className="h-screen w-screen bg-terminal-bg text-terminal-text flex flex-col overflow-hidden font-sans">
        <OAuthCallbackHandler />

        {/* Header */}
        <header className="h-[72px] bg-[var(--header-bg)] flex items-center px-8 shrink-0 justify-between z-10 shadow-xl transition-colors duration-300">
          <div className="flex items-center gap-3">
            <img src="/favicon.ico" alt="Orkes Logo" className="w-8 h-8 object-contain" />
            <h1 className="font-bold text-xl text-terminal-text tracking-tight">MCP Workbench</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <a
                href="https://join.slack.com/t/orkes-conductor/shared_invite/zt-3dpcskdyd-W895bJDm8psAV7viYG3jFA"
                target="_blank"
                rel="noopener noreferrer"
                className="text-terminal-text hover:text-terminal-cyan transition-colors flex items-center gap-1.5 text-sm font-bold"
              >
                <Slack className="w-4 h-4" />
                <span>Slack</span>
              </a>
              <a
                href="https://github.com/conductor-oss/mcp-workbench"
                target="_blank"
                rel="noopener noreferrer"
                className="text-terminal-text hover:text-terminal-cyan transition-colors flex items-center gap-1.5 text-sm font-bold"
              >
                <Github className="w-4 h-4" />
                <span>Github</span>
              </a>
              <a
                href="https://modelcontextprotocol.io/docs/getting-started/intro"
                target="_blank"
                rel="noopener noreferrer"
                className="text-terminal-text hover:text-terminal-cyan transition-colors flex items-center gap-1.5 text-sm font-bold"
                title="Model Context Protocol Documentation"
              >
                <MCPIcon className="w-4 h-4" />
                <span>MCP Specs</span>
              </a>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-terminal-surface/50 transition-colors text-terminal-text-muted hover:text-terminal-text"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <div className="text-[10px] text-terminal-text-muted bg-terminal-surface px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">v1.0.0</div>
            </div>
          </div>
        </header>

        {/* Main Workspace */}
        <div className="flex-1 flex overflow-hidden">

          {/* Sidebar: Connection Manager */}
          <aside className="w-[440px] bg-[var(--header-bg)] flex flex-col shrink-0">
            <div className="p-4 overflow-y-auto flex-1">
              <ConnectionManager onShowGettingStarted={() => setShowGettingStarted(true)} />
            </div>
          </aside>

          {/* Central Content */}
          <main className="flex-1 flex flex-col min-w-0 bg-terminal-bg">

            {/* Tabs / Toolbar */}
            <div className="h-12 flex items-center px-6 gap-6 bg-transparent">
              <button
                onClick={() => switchToTab('tools')}
                className={`flex items-center gap-2 h-full px-2 border-b-2 transition-colors text-sm font-medium ${activeTab === 'tools' ? 'border-terminal-cyan text-terminal-cyan' : 'border-transparent text-terminal-text hover:text-terminal-cyan'}`}
              >
                <Wrench className="w-4 h-4" /> Tools
              </button>
              <button
                onClick={() => switchToTab('prompts')}
                className={`flex items-center gap-2 h-full px-2 border-b-2 transition-colors text-sm font-medium ${activeTab === 'prompts' ? 'border-terminal-cyan text-terminal-cyan' : 'border-transparent text-terminal-text hover:text-terminal-cyan'}`}
              >
                <MessageSquare className="w-4 h-4" /> Prompts
              </button>
              <button
                onClick={() => switchToTab('tasks')}
                className={`flex items-center gap-2 h-full px-2 border-b-2 transition-colors text-sm font-medium ${activeTab === 'tasks' ? 'border-terminal-cyan text-terminal-cyan' : 'border-transparent text-terminal-text hover:text-terminal-cyan'}`}
              >
                <ClipboardList className="w-4 h-4" /> Tasks
              </button>
              <button
                onClick={() => switchToTab('resources')}
                className={`flex items-center gap-2 h-full px-2 border-b-2 transition-colors text-sm font-medium ${activeTab === 'resources' ? 'border-terminal-cyan text-terminal-cyan' : 'border-transparent text-terminal-text hover:text-terminal-cyan'}`}
              >
                <Database className="w-4 h-4" /> Resources
              </button>

              <div className="flex-1" />

              <button
                onClick={() => switchToTab('learn')}
                className={`flex items-center gap-2 h-full px-2 border-b-2 transition-colors text-sm font-medium ${activeTab === 'learn' ? 'border-terminal-cyan text-terminal-cyan' : 'border-transparent text-terminal-text hover:text-terminal-cyan'}`}
              >
                <GraduationCap className="w-4 h-4" /> Learn MCP
              </button>

              <button
                onClick={() => switchToTab('changelog')}
                className={`flex items-center gap-2 h-full px-2 border-b-2 transition-colors text-sm font-medium ${activeTab === 'changelog' ? 'border-terminal-purple text-terminal-purple' : 'border-transparent text-terminal-text hover:text-terminal-purple'}`}
              >
                <Sparkles className="w-4 h-4" /> What's new
              </button>



              <button
                onClick={() => setShowLogs(!showLogs)}
                className={`flex items-center gap-2 text-xs font-medium px-2 py-1 rounded transition-colors ${showLogs ? 'bg-terminal-surface text-terminal-text' : 'text-terminal-text-muted hover:text-terminal-text'}`}
              >
                <Terminal className="w-3 h-3" /> Logs
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto">
              {activeTab === 'resources' && <ResourceExplorer />}
              {activeTab === 'tools' && <ToolTester />}
              {activeTab === 'prompts' && <PromptTester />}
              {activeTab === 'tasks' && <TaskManager />}
              {activeTab === 'learn' && <LearnMCP />}
              {activeTab === 'changelog' && <ChangelogViewer />}
            </div>

            {/* Bottom Panel: Logs */}
            {showLogs && (
              <div className="h-64 bg-[var(--header-bg)] flex flex-col shrink-0 transition-all">
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
        <footer className="h-8 bg-terminal-bg flex items-center justify-center px-4 shrink-0">
          <a
            href="https://orkes.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-terminal-text-muted hover:text-terminal-cyan transition-colors uppercase tracking-widest font-bold flex items-center gap-1"
          >
            powered by <span className="text-terminal-cyan">orkes.io</span>
          </a>
        </footer>

        {/* Getting Started Modal */}
        {showGettingStarted && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowGettingStarted(false)}>
            <div className="bg-terminal-bg rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-terminal-border bg-[var(--header-bg)] shadow-sm">
                <h2 className="text-sm font-bold text-terminal-text uppercase tracking-[0.2em]">Getting Started Guide</h2>
                <button onClick={() => setShowGettingStarted(false)} className="p-1.5 hover:bg-terminal-surface rounded-md transition-colors text-terminal-text-muted hover:text-terminal-text">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-auto">
                <GettingStarted />
              </div>
            </div>
          </div>
        )}
      </div>
    </MCPProvider>
  )
}

export default App
