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

import { useEffect, useRef } from 'react';

export const OAuthCallbackHandler = () => {
    // Determine if we are running as a popup with a code
    const processedRef = useRef(false);

    useEffect(() => {
        if (processedRef.current) return;
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code && window.opener) {
            processedRef.current = true;
            console.log("Got OAuth code, sending to opener", code);
            window.opener.postMessage({ type: 'oauth_code', code }, window.location.origin);
            // Close after a short delay
            setTimeout(() => {
                window.close();
            }, 500);
        }
    }, []);

    // Check if we are in the popup state
    const params = new URLSearchParams(window.location.search);
    if (params.get('code') && window.opener) {
        return (
            <div className="fixed inset-0 bg-solar-base3 flex items-center justify-center z-50">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-solar-blue">Authenticating...</h2>
                    <p className="text-solar-base01">You may close this window.</p>
                </div>
            </div>
        );
    }

    return null;
};
