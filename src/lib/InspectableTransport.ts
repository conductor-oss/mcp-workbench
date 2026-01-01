import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";

export type LogEntry = {
    timestamp: string;
    direction: 'in' | 'out';
    type: 'request' | 'response' | 'notification' | 'error';
    method?: string;
    content: any;
};

export class InspectableTransport implements Transport {
    private _transport: Transport;
    private _onLog: (entry: LogEntry) => void;

    constructor(transport: Transport, onLog: (entry: LogEntry) => void) {
        this._transport = transport;
        this._onLog = onLog;
    }

    async start(): Promise<void> {
        return this._transport.start();
    }

    async close(): Promise<void> {
        return this._transport.close();
    }

    async send(message: JSONRPCMessage): Promise<void> {
        this._log('out', message);
        return this._transport.send(message);
    }

    get onmessage(): ((message: JSONRPCMessage) => void) | undefined {
        return this._transport.onmessage;
    }

    set onmessage(callback: ((message: JSONRPCMessage) => void) | undefined) {
        this._transport.onmessage = (message) => {
            this._log('in', message);
            if (callback) callback(message);
        };
    }

    get onclose(): (() => void) | undefined {
        return this._transport.onclose;
    }

    set onclose(callback: (() => void) | undefined) {
        this._transport.onclose = callback;
    }

    get onerror(): ((error: Error) => void) | undefined {
        return this._transport.onerror;
    }

    set onerror(callback: ((error: Error) => void) | undefined) {
        this._transport.onerror = (error) => {
            this._onLog({
                timestamp: new Date().toLocaleTimeString(),
                direction: 'in',
                type: 'error',
                content: error.message
            });
            if (callback) callback(error);
        };
    }

    private _log(direction: 'in' | 'out', message: JSONRPCMessage) {
        // Debug logging to console to verify interception
        console.log(`[InspectableTransport] ${direction === 'out' ? '>>' : '<<'}`, message);

        let type: LogEntry['type'] = 'notification';
        let method = '';

        if ('method' in message) {
            type = 'id' in message ? 'request' : 'notification';
            method = message.method;
        } else if ('result' in message) {
            type = 'response';
        } else if ('error' in message) {
            type = 'error';
        }

        this._onLog({
            timestamp: new Date().toLocaleTimeString(),
            direction,
            type,
            method,
            content: message
        });
    }
}
