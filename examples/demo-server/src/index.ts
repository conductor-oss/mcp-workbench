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

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 8080;

// CORS configuration for browser access
app.use(cors({
    origin: '*',
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// Safari-specific CORS header
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Private-Network', 'true');
    next();
});

app.use(express.json());

// In-memory task storage
const tasks = new Map<string, any>();

// JSON-RPC handler
app.post('/mcp', (req, res) => {
    const { jsonrpc, method, params, id } = req.body;

    console.log(`[MCP] ${method}`, params);

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
                        name: 'mcp-demo-server',
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
                                        description: 'Temperature units',
                                        default: 'celsius'
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
                    result = {
                        content: [{
                            type: 'text',
                            text: `Result: ${a} ${operation} ${b} = ${answer}`
                        }]
                    };
                } else if (name === 'get_weather') {
                    const { city, units = 'celsius' } = args;
                    const temp = units === 'celsius' ? 22 : 72;
                    const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)];
                    result = {
                        content: [{
                            type: 'text',
                            text: `Weather in ${city}: ${conditions}, ${temp}°${units === 'celsius' ? 'C' : 'F'}`
                        }]
                    };
                } else if (name === 'generate_uuid') {
                    const uuid = crypto.randomUUID();
                    result = {
                        content: [{
                            type: 'text',
                            text: `Generated UUID: ${uuid}`
                        }]
                    };
                } else if (name === 'echo') {
                    result = {
                        content: [{
                            type: 'text',
                            text: `Echo: ${args.message}`
                        }]
                    };
                } else {
                    throw new Error(`Unknown tool: ${name}`);
                }
                break;

            case 'prompts/list':
                result = {
                    prompts: [
                        {
                            name: 'code_review',
                            description: 'Generate a code review template',
                            arguments: [
                                {
                                    name: 'language',
                                    description: 'Programming language',
                                    required: true
                                },
                                {
                                    name: 'focus_area',
                                    description: 'Area to focus on (security, performance, style)',
                                    required: false
                                }
                            ]
                        },
                        {
                            name: 'summarize',
                            description: 'Create a summary template',
                            arguments: [
                                {
                                    name: 'content_type',
                                    description: 'Type of content to summarize',
                                    required: true
                                }
                            ]
                        },
                        {
                            name: 'debug_assistant',
                            description: 'Debugging helper prompt',
                            arguments: [
                                {
                                    name: 'error_type',
                                    description: 'Type of error encountered',
                                    required: true
                                }
                            ]
                        }
                    ]
                };
                break;

            case 'prompts/get':
                const promptName = params.name;
                const promptArgs = params.arguments || {};

                if (promptName === 'code_review') {
                    const { language, focus_area = 'general' } = promptArgs;
                    result = {
                        messages: [
                            {
                                role: 'user',
                                content: {
                                    type: 'text',
                                    text: `Please review this ${language} code with focus on ${focus_area}. Provide:\n1. Overall assessment\n2. Specific issues\n3. Recommendations\n4. Security concerns (if any)`
                                }
                            }
                        ]
                    };
                } else if (promptName === 'summarize') {
                    const { content_type } = promptArgs;
                    result = {
                        messages: [
                            {
                                role: 'user',
                                content: {
                                    type: 'text',
                                    text: `Summarize the following ${content_type}. Include:\n- Main points\n- Key takeaways\n- Action items (if applicable)`
                                }
                            }
                        ]
                    };
                } else if (promptName === 'debug_assistant') {
                    const { error_type } = promptArgs;
                    result = {
                        messages: [
                            {
                                role: 'user',
                                content: {
                                    type: 'text',
                                    text: `Help debug this ${error_type} error. Provide:\n1. Likely causes\n2. Debugging steps\n3. Common solutions\n4. Prevention tips`
                                }
                            }
                        ]
                    };
                } else {
                    throw new Error(`Unknown prompt: ${promptName}`);
                }
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
                const uri = params.uri;

                if (uri === 'demo://docs/getting-started') {
                    result = {
                        contents: [{
                            uri,
                            mimeType: 'text/markdown',
                            text: '# Getting Started\n\nWelcome to the demo MCP server!\n\n## Features\n- Tools for calculations and utilities\n- Prompts for common tasks\n- Resources for documentation\n- Tasks for long-running operations'
                        }]
                    };
                } else if (uri === 'demo://config/server.json') {
                    result = {
                        contents: [{
                            uri,
                            mimeType: 'application/json',
                            text: JSON.stringify({
                                name: 'demo-server',
                                version: '1.0.0',
                                features: ['tools', 'prompts', 'resources', 'tasks']
                            }, null, 2)
                        }]
                    };
                } else if (uri === 'demo://docs/api-reference') {
                    result = {
                        contents: [{
                            uri,
                            mimeType: 'text/markdown',
                            text: '# API Reference\n\n## Tools\n- `calculator`: Arithmetic operations\n- `get_weather`: Weather data\n- `generate_uuid`: UUID generation\n- `echo`: Echo messages\n\n## Prompts\n- `code_review`: Code review templates\n- `summarize`: Summary templates\n- `debug_assistant`: Debugging help'
                        }]
                    };
                } else {
                    throw new Error(`Unknown resource: ${uri}`);
                }
                break;

            default:
                throw new Error(`Unknown method: ${method}`);
        }

        res.json({
            jsonrpc: '2.0',
            id,
            result
        });
    } catch (error: any) {
        console.error('[MCP] Error:', error.message);
        res.json({
            jsonrpc: '2.0',
            id,
            error: {
                code: -32603,
                message: error.message
            }
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Demo MCP Server running on http://localhost:${PORT}/mcp`);
    console.log(`📝 Features: Tools, Prompts, Resources`);
    console.log(`🌐 CORS enabled for browser access`);
});
