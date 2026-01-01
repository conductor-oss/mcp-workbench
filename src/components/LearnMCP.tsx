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
import { BookOpen, ExternalLink, PlayCircle, Book } from 'lucide-react';

export const LearnMCP: React.FC = () => {
    return (
        <div className="max-w-5xl mx-auto p-6 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Hero Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <BookOpen className="w-8 h-8 text-solar-blue" />
                    <h1 className="text-3xl font-bold text-solar-base01">Learn Model Context Protocol</h1>
                </div>
                <p className="text-solar-base1 text-lg max-w-3xl leading-relaxed">
                    The Model Context Protocol (MCP) is an open standard that enables AI models to interact with external data sources and tools seamlessly. Master the protocol with these curated resources.
                </p>

                {/* Video Hero */}
                <div className="aspect-video w-full rounded-xl overflow-hidden shadow-2xl border-4 border-solar-base2 bg-black relative group">
                    <iframe
                        className="w-full h-full"
                        src="https://www.youtube.com/embed/Xa9Nk0zrjBk"
                        title="MCP Introduction Video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
            </section>

            {/* Article Grid */}
            <section className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-solar-base01 flex items-center gap-2">
                        <PlayCircle className="w-5 h-5 text-solar-blue" />
                        Getting Started
                    </h2>
                    <div className="grid gap-4">
                        <ArticleCard
                            title="Introduction to MCP"
                            description="Learn the core concepts of the Model Context Protocol and why it matters for Agentic AI."
                            link="https://modelcontextprotocol.io/docs/getting-started/intro"
                        />
                        <ArticleCard
                            title="Architecture Deep Dive"
                            description="Understand the relationship between Clients, Servers, and Remote Hosts."
                            link="https://modelcontextprotocol.io/docs/learn/architecture"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-solar-base01 flex items-center gap-2">
                        <Book className="w-5 h-5 text-solar-blue" />
                        Advanced Topics
                    </h2>
                    <div className="grid gap-4">
                        <ArticleCard
                            title="Writing Your First Server"
                            description="A step-by-step guide to exposing local tools and data to AI models using the MCP SDK."
                            link="https://modelcontextprotocol.io/docs/quickstart/server"
                        />
                        <ArticleCard
                            title="Protocol Specification"
                            description="Explore the full JSON-RPC 2.0 based message specification for MCP."
                            link="https://modelcontextprotocol.io/specification/2025-11-25"
                        />
                    </div>
                </div>
            </section>

            {/* Footer Call to Action */}
            <div className="bg-solar-base2/20 rounded-xl p-8 border border-solar-base2 text-center space-y-4">
                <h3 className="text-lg font-bold text-solar-base01">Ready to build?</h3>
                <p className="text-solar-base1">Join the community and start contributing to the future of context-aware AI.</p>
                <a
                    href="https://join.slack.com/t/orkes-conductor/shared_invite/zt-3dpcskdyd-W895bJDm8psAV7viYG3jFA"
                    className="inline-flex items-center gap-2 bg-solar-blue text-white px-6 py-2 rounded-lg font-bold hover:bg-opacity-90 transition-colors shadow-lg"
                >
                    Join Orkes Slack
                    <ExternalLink className="w-4 h-4" />
                </a>
            </div>
        </div>
    );
};

const ArticleCard: React.FC<{ title: string; description: string; link: string }> = ({ title, description, link }) => (
    <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-4 bg-solar-base3 border border-solar-base2 rounded-lg hover:border-solar-blue hover:shadow-md transition-all group"
    >
        <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-solar-base01 group-hover:text-solar-blue transition-colors">{title}</h4>
            <ExternalLink className="w-4 h-4 text-solar-base2 group-hover:text-solar-blue transition-colors" />
        </div>
        <p className="text-sm text-solar-base1 leading-relaxed">{description}</p>
    </a>
);
