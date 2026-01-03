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

#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ErrorCode,
    McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// --- Domain Models ---

type TicketStatus = 'OPEN' | 'ORDER_VERIFIED' | 'ITEM_ASSESSED' | 'SOLUTION_PROPOSED' | 'RESOLVED' | 'CLOSED';

interface ReturnItem {
    sku: string;
    reason: string;
    condition: 'new' | 'opened' | 'damaged' | 'defective';
    decision?: 'approved' | 'rejected';
    refundAmount?: number;
    notes?: string;
}

interface SupportTicket {
    ticketId: string;
    customerEmail: string;
    orderId: string;
    status: TicketStatus;
    items: ReturnItem[];
    totalRefundable: number;
    resolutionType?: 'refund_card' | 'store_credit' | 'replacement';
    history: string[]; // Audit log
}

// --- Mock Database & Policy Engine ---

const TICKETS = new Map<string, SupportTicket>();

// Mock Order DB
const ORDERS: Record<string, { email: string; orderDate: string; items: { sku: string; price: number; name: string; category: string }[] }> = {
    'ORD-2024-001': {
        email: 'alice@example.com',
        orderDate: '2024-01-15',
        items: [
            { sku: 'SKU-LAPTOP', price: 1200, name: 'Pro Laptop 15"', category: 'electronics' },
            { sku: 'SKU-MOUSE', price: 50, name: 'Wireless Mouse', category: 'accessories' }
        ]
    },
    'ORD-2024-002': {
        email: 'bob@example.com',
        orderDate: '2023-11-01', // Too old for 30 day return
        items: [
            { sku: 'SKU-HEADSET', price: 200, name: 'Noise Cancellation Headset', category: 'electronics' }
        ]
    },
    'ORD-2024-003': {
        email: 'charlie@example.com',
        orderDate: '2024-01-28',
        items: [
            { sku: 'SKU-UNDERWEAR', price: 25, name: 'Comfort Boxers 3-Pack', category: 'apparel_restricted' }
        ]
    }
};

// --- Server Setup ---

const server = new Server(
    {
        name: "ecommerce-support-agent",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// --- Tool Implementations ---

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "list_orders",
                description: "List all recent orders to help identify the correct Order ID.",
                inputSchema: {
                    type: "object",
                    properties: {},
                }
            },
            {
                name: "open_ticket",
                description: "Opens a new support ticket for a customer order. Validates order existence and return window (30 days).",
                inputSchema: {
                    type: "object",
                    properties: {
                        order_id: { type: "string", description: "The order ID provided by the customer" },
                        customer_email: { type: "string" }
                    },
                    required: ["order_id", "customer_email"]
                }
            },
            {
                name: "assess_item",
                description: "Evaluates a line item for return eligibility based on condition and category policies.",
                inputSchema: {
                    type: "object",
                    properties: {
                        ticket_id: { type: "string" },
                        sku: { type: "string" },
                        condition: { type: "string", enum: ["new", "opened", "damaged", "defective"] },
                        reason: { type: "string" }
                    },
                    required: ["ticket_id", "sku", "condition", "reason"]
                }
            },
            {
                name: "calculate_refund_eligibility",
                description: "Calculates the total refund amount based on assessed items. Must be run before resolution.",
                inputSchema: {
                    type: "object",
                    properties: {
                        ticket_id: { type: "string" }
                    },
                    required: ["ticket_id"]
                }
            },
            {
                name: "process_resolution",
                description: "Finalizes the ticket with a chosen resolution. Requires 'SOLUTION_PROPOSED' status.",
                inputSchema: {
                    type: "object",
                    properties: {
                        ticket_id: { type: "string" },
                        resolution_type: { type: "string", enum: ["refund_card", "store_credit", "replacement"] },
                        customer_confirmation: { type: "boolean", description: "Did customer explicitly agree?" }
                    },
                    required: ["ticket_id", "resolution_type", "customer_confirmation"]
                }
            },
            {
                name: "get_ticket_status",
                description: "Retrieves the full current state of a ticket.",
                inputSchema: {
                    type: "object",
                    properties: {
                        ticket_id: { type: "string" }
                    },
                    required: ["ticket_id"]
                }
            }
        ]
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "list_orders") {
        return {
            content: [{
                type: "text",
                text: JSON.stringify(
                    Object.entries(ORDERS).map(([id, o]) => ({
                        id,
                        email: o.email,
                        date: o.orderDate,
                        itemCount: o.items.length
                    })),
                    null,
                    2
                )
            }]
        };
    }

    if (name === "open_ticket") {
        const { order_id, customer_email } = z.object({ order_id: z.string(), customer_email: z.string() }).parse(args);

        const order = ORDERS[order_id];
        if (!order) {
            throw new McpError(ErrorCode.InvalidParams, `Order ${order_id} not found.`);
        }
        if (order.email !== customer_email) {
            throw new McpError(ErrorCode.InvalidParams, `Email ${customer_email} does not match order record.`);
        }

        // Check 30-day window (Mock date: 2024-02-01)
        const today = new Date('2024-02-01');
        const orderDate = new Date(order.orderDate);
        const diffDays = Math.ceil(Math.abs(today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays > 30) {
            return {
                content: [{ type: "text", text: `Error: Return window closed. Order is ${diffDays} days old (Limit: 30).` }],
                isError: true
            };
        }

        const ticketId = `TKT-${Math.floor(Math.random() * 10000)}`;
        const ticket: SupportTicket = {
            ticketId,
            customerEmail: customer_email,
            orderId: order_id,
            status: 'OPEN',
            items: [],
            totalRefundable: 0,
            history: [`[OPEN] Ticket created for Order ${order_id}`]
        };
        TICKETS.set(ticketId, ticket);

        return {
            content: [{ type: "text", text: `Ticket ${ticketId} created. Order contains: ${JSON.stringify(order.items.map(i => ({ sku: i.sku, name: i.name })))}` }]
        };
    }

    if (name === "assess_item") {
        const { ticket_id, sku, condition, reason } = z.object({
            ticket_id: z.string(),
            sku: z.string(),
            condition: z.enum(["new", "opened", "damaged", "defective"]),
            reason: z.string()
        }).parse(args);

        const ticket = TICKETS.get(ticket_id);
        if (!ticket) throw new McpError(ErrorCode.InvalidParams, "Ticket not found");

        const order = ORDERS[ticket.orderId];
        const item = order.items.find(i => i.sku === sku);
        if (!item) throw new McpError(ErrorCode.InvalidParams, "SKU not found in original order");

        // Policy Logic
        let decision: 'approved' | 'rejected' = 'approved';
        let amount = item.price;
        let note = "Standard return.";

        if (item.category === 'apparel_restricted' && condition !== 'new') {
            decision = 'rejected';
            amount = 0;
            note = "Policy Violation: Intimate apparel cannot be returned if opened.";
        } else if (condition === 'damaged' && reason.toLowerCase().includes('customer')) {
            decision = 'rejected';
            amount = 0;
            note = "Policy Violation: Customer inflicted damage.";
        } else if (condition === 'opened') {
            amount = item.price * 0.85; // 15% restocking fee
            note = "15% restocking fee applied for opened item.";
        }

        ticket.items.push({ sku, condition, reason, decision, refundAmount: amount, notes: note });
        ticket.status = 'ITEM_ASSESSED';
        ticket.history.push(`[ASSESS] ${sku}: ${decision} (${note})`);

        return {
            content: [{ type: "text", text: `Item ${sku} assessed: ${decision.toUpperCase()}. Refundable: $${amount}. Note: ${note}` }]
        };
    }

    if (name === "calculate_refund_eligibility") {
        const { ticket_id } = z.object({ ticket_id: z.string() }).parse(args);
        const ticket = TICKETS.get(ticket_id);
        if (!ticket) throw new McpError(ErrorCode.InvalidParams, "Ticket not found");

        if (ticket.items.length === 0) {
            return { content: [{ type: "text", text: "Error: No items have been assessed yet." }], isError: true };
        }

        const total = ticket.items.reduce((sum, i) => sum + (i.refundAmount || 0), 0);
        ticket.totalRefundable = total;
        ticket.status = 'SOLUTION_PROPOSED';
        ticket.history.push(`[CALC] Total eligible refund calculated: $${total}`);

        return {
            content: [{ type: "text", text: `Refund Calculation Complete. Total Eligible: $${total}. You may now proceed to resolution.` }]
        };
    }

    if (name === "process_resolution") {
        const { ticket_id, resolution_type, customer_confirmation } = z.object({
            ticket_id: z.string(),
            resolution_type: z.enum(["refund_card", "store_credit", "replacement"]),
            customer_confirmation: z.boolean()
        }).parse(args);

        const ticket = TICKETS.get(ticket_id);
        if (!ticket) throw new McpError(ErrorCode.InvalidParams, "Ticket not found");

        if (ticket.status !== 'SOLUTION_PROPOSED') {
            return { content: [{ type: "text", text: `Error: Ticket status is ${ticket.status}, but must be SOLUTION_PROPOSED. Please calculate eligibility first.` }], isError: true };
        }

        if (!customer_confirmation) {
            return { content: [{ type: "text", text: "Error: Customer must confirm the resolution." }], isError: true };
        }

        ticket.resolutionType = resolution_type;
        ticket.status = 'RESOLVED';
        ticket.history.push(`[RESOLVE] Closed with ${resolution_type}`);

        // In a real app, this would call Stripe/Shopify API
        return {
            content: [{
                type: "text",
                text: `SUCCESS: Ticket ${ticket_id} closed. $${ticket.totalRefundable} processed via ${resolution_type}. Email sent to ${ticket.customerEmail}.`
            }]
        };
    }

    if (name === "get_ticket_status") {
        const { ticket_id } = z.object({ ticket_id: z.string() }).parse(args);
        const ticket = TICKETS.get(ticket_id);
        if (!ticket) throw new McpError(ErrorCode.InvalidParams, "Ticket not found");
        return { content: [{ type: "text", text: JSON.stringify(ticket, null, 2) }] };
    }

    throw new McpError(ErrorCode.MethodNotFound, `Tool ${name} not found`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
