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

export interface OAuthOptions {
    authUrl: string;
    tokenUrl: string;
    clientId: string;
    clientSecret?: string;
    scope?: string;
}

/**
 * Initiates an OAuth 2.0 Authorization Code Flow via a popup.
 * Returns the access token on success.
 */
export async function initiateOAuthFlow(options: OAuthOptions): Promise<string> {
    const { authUrl, tokenUrl, clientId, clientSecret, scope } = options;

    if (!authUrl) throw new Error("Missing Auth URL");
    if (!tokenUrl) throw new Error("Missing Token URL");

    const redirectUri = window.location.origin;
    const state = crypto.randomUUID();
    const popupUrl = new URL(authUrl);
    popupUrl.searchParams.set('response_type', 'code');
    popupUrl.searchParams.set('client_id', clientId || 'mcp-workbench');
    popupUrl.searchParams.set('redirect_uri', redirectUri);
    popupUrl.searchParams.set('state', state);
    if (scope) popupUrl.searchParams.set('scope', scope);

    const popup = window.open(popupUrl.toString(), 'oauth_popup', 'width=600,height=700');
    if (!popup) {
        throw new Error("Popup blocked. Please allow popups for this site.");
    }

    return new Promise((resolve, reject) => {
        const handleMessage = async (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            if (event.data?.type === 'oauth_code') {
                const code = event.data.code;
                popup.close();
                window.removeEventListener('message', handleMessage);

                // Exchange code for token
                try {
                    const params = new URLSearchParams();
                    params.set('grant_type', 'authorization_code');
                    params.set('code', code);
                    params.set('redirect_uri', redirectUri);
                    params.set('client_id', clientId || 'mcp-workbench');
                    if (clientSecret) params.set('client_secret', clientSecret);

                    console.log("[OAuth Utility] Exchanging token...");

                    const res = await fetch(tokenUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'ngrok-skip-browser-warning': 'true'
                        },
                        body: params
                    });

                    const data = await res.json();
                    if (data.access_token) {
                        resolve(data.access_token);
                    } else {
                        reject(new Error("Failed to get token: " + JSON.stringify(data)));
                    }
                } catch (e: any) {
                    reject(new Error("Error exchanging token: " + e.message));
                }
            }
        };

        window.addEventListener('message', handleMessage);

        // Monitor popup closure
        const timer = setInterval(() => {
            if (popup.closed) {
                clearInterval(timer);
                window.removeEventListener('message', handleMessage);
                reject(new Error("Authentication cancelled by user."));
            }
        }, 1000);
    });
}
