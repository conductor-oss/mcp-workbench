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
