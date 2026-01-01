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

import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';

/**
 * Mock MCP Transport for Demo Mode
 * Simulates a complete MCP server entirely in the browser
 */
export class MockMCPTransport implements Transport {
    onclose?: () => void;
    onerror?: (error: Error) => void;
    onmessage?: (message: JSONRPCMessage) => void;

    async start(): Promise<void> {
        console.log('[MockMCP] Transport started');
    }

    async close(): Promise<void> {
        console.log('[MockMCP] Transport closed');
        this.onclose?.();
    }

    async send(message: JSONRPCMessage): Promise<void> {
        console.log('[MockMCP] Request:', message);

        // Simulate network delay
        setTimeout(() => {
            const response = this.handleRequest(message);
            console.log('[MockMCP] Response:', response);

            if (this.onmessage) {
                this.onmessage(response as JSONRPCMessage);
            }
        }, 100);
    }

    private handleRequest(request: any): any {
        const { method, params, id } = request;

        try {
            let result;

            switch (method) {
                case 'initialize':
                    result = {
                        protocolVersion: '2024-11-05',
                        capabilities: {
                            tools: {},
                            prompts: {},
                            resources: {}
                        },
                        serverInfo: {
                            name: 'mcp-demo-mock',
                            version: '1.0.0'
                        }
                    };
                    break;

                case 'tools/list':
                    result = {
                        tools: [
                            {
                                name: 'calculator',
                                description: 'Perform basic arithmetic operations (add, subtract, multiply, divide)',
                                inputSchema: {
                                    type: 'object',
                                    properties: {
                                        operation: {
                                            type: 'string',
                                            enum: ['add', 'subtract', 'multiply', 'divide'],
                                            description: 'The arithmetic operation to perform'
                                        },
                                        a: { type: 'number', description: 'First number' },
                                        b: { type: 'number', description: 'Second number' }
                                    },
                                    required: ['operation', 'a', 'b']
                                }
                            },
                            {
                                name: 'get_weather',
                                description: 'Get current weather for a city (simulated data)',
                                inputSchema: {
                                    type: 'object',
                                    properties: {
                                        city: { type: 'string', description: 'City name' },
                                        units: {
                                            type: 'string',
                                            enum: ['celsius', 'fahrenheit'],
                                            description: 'Temperature units'
                                        }
                                    },
                                    required: ['city']
                                }
                            },
                            {
                                name: 'generate_uuid',
                                description: 'Generate a random UUID v4',
                                inputSchema: {
                                    type: 'object',
                                    properties: {}
                                }
                            },
                            {
                                name: 'echo',
                                description: 'Echo back the provided message',
                                inputSchema: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string', description: 'Message to echo' }
                                    },
                                    required: ['message']
                                }
                            }
                        ]
                    };
                    break;

                case 'tools/call':
                    result = this.handleToolCall(params);
                    break;

                case 'prompts/list':
                    result = {
                        prompts: [
                            {
                                name: 'code_review',
                                description: 'Generate a code review template',
                                arguments: [
                                    { name: 'language', description: 'Programming language', required: true },
                                    { name: 'focus_area', description: 'Area to focus on', required: false }
                                ]
                            },
                            {
                                name: 'summarize',
                                description: 'Create a summary template',
                                arguments: [
                                    { name: 'content_type', description: 'Type of content', required: true }
                                ]
                            },
                            {
                                name: 'debug_assistant',
                                description: 'Debugging helper prompt',
                                arguments: [
                                    { name: 'error_type', description: 'Type of error', required: true }
                                ]
                            }
                        ]
                    };
                    break;

                case 'prompts/get':
                    result = this.handlePromptGet(params);
                    break;

                case 'resources/list':
                    result = {
                        resources: [
                            {
                                uri: 'demo://docs/getting-started',
                                name: 'Getting Started Guide',
                                description: 'Quick start documentation',
                                mimeType: 'text/markdown'
                            },
                            {
                                uri: 'demo://config/server.json',
                                name: 'Server Configuration',
                                description: 'Example server configuration',
                                mimeType: 'application/json'
                            },
                            {
                                uri: 'demo://docs/api-reference',
                                name: 'API Reference',
                                description: 'Complete API documentation',
                                mimeType: 'text/markdown'
                            }
                        ]
                    };
                    break;

                case 'resources/read':
                    result = this.handleResourceRead(params);
                    break;

                default:
                    throw new Error(`Unknown method: ${method}`);
            }

            return {
                jsonrpc: '2.0',
                id,
                result
            };
        } catch (error: any) {
            return {
                jsonrpc: '2.0',
                id,
                error: {
                    code: -32603,
                    message: error.message
                }
            };
        }
    }

    private handleToolCall(params: any): any {
        const { name, arguments: args } = params;

        if (name === 'calculator') {
            const { operation, a, b } = args;
            let answer;
            switch (operation) {
                case 'add': answer = a + b; break;
                case 'subtract': answer = a - b; break;
                case 'multiply': answer = a * b; break;
                case 'divide': answer = b !== 0 ? a / b : 'Error: Division by zero'; break;
            }
            return {
                content: [{
                    type: 'text',
                    text: `Result: ${a} ${operation} ${b} = ${answer}`
                }]
            };
        } else if (name === 'get_weather') {
            const { city, units = 'celsius' } = args;
            const temp = units === 'celsius' ? 22 : 72;
            const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)];
            return {
                content: [{
                    type: 'text',
                    text: `Weather in ${city}: ${conditions}, ${temp}°${units === 'celsius' ? 'C' : 'F'}`
                }]
            };
        } else if (name === 'generate_uuid') {
            return {
                content: [{
                    type: 'text',
                    text: `Generated UUID: ${crypto.randomUUID()}`
                }]
            };
        } else if (name === 'echo') {
            return {
                content: [{
                    type: 'text',
                    text: `Echo: ${args.message}`
                }]
            };
        } else {
            throw new Error(`Unknown tool: ${name}`);
        }
    }

    private handlePromptGet(params: any): any {
        const { name, arguments: args = {} } = params;

        if (name === 'code_review') {
            const { language, focus_area = 'general' } = args;
            return {
                messages: [{
                    role: 'user',
                    content: {
                        type: 'text',
                        text: `Please review this ${language} code with focus on ${focus_area}. Provide:\n1. Overall assessment\n2. Specific issues\n3. Recommendations\n4. Security concerns (if any)`
                    }
                }]
            };
        } else if (name === 'summarize') {
            const { content_type } = args;
            return {
                messages: [{
                    role: 'user',
                    content: {
                        type: 'text',
                        text: `Summarize the following ${content_type}. Include:\n- Main points\n- Key takeaways\n- Action items (if applicable)`
                    }
                }]
            };
        } else if (name === 'debug_assistant') {
            const { error_type } = args;
            return {
                messages: [{
                    role: 'user',
                    content: {
                        type: 'text',
                        text: `Help debug this ${error_type} error. Provide:\n1. Likely causes\n2. Debugging steps\n3. Common solutions\n4. Prevention tips`
                    }
                }]
            };
        } else {
            throw new Error(`Unknown prompt: ${name}`);
        }
    }

    private handleResourceRead(params: any): any {
        const { uri } = params;

        if (uri === 'demo://docs/getting-started') {
            return {
                contents: [{
                    uri,
                    mimeType: 'text/markdown',
                    text: '# Getting Started\n\nWelcome to the demo MCP server!\n\n## Features\n- Tools for calculations and utilities\n- Prompts for common tasks\n- Resources for documentation\n\nThis is a mock server running entirely in your browser - no backend required!'
                }]
            };
        } else if (uri === 'demo://config/server.json') {
            return {
                contents: [{
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify({
                        name: 'demo-server',
                        version: '1.0.0',
                        mode: 'mock',
                        features: ['tools', 'prompts', 'resources']
                    }, null, 2)
                }]
            };
        } else if (uri === 'demo://docs/api-reference') {
            return {
                contents: [{
                    uri,
                    mimeType: 'text/markdown',
                    text: '# API Reference\n\n## Tools\n- `calculator`: Arithmetic operations\n- `get_weather`: Weather data (simulated)\n- `generate_uuid`: UUID generation\n- `echo`: Echo messages\n\n## Prompts\n- `code_review`: Code review templates\n- `summarize`: Summary templates\n- `debug_assistant`: Debugging help'
                }]
            };
        } else {
            throw new Error(`Unknown resource: ${uri}`);
        }
    }
}
