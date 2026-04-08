import React, { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const AuthMonitor = ({ children }) => {
    const location = useLocation();

    // Utility to decode JWT token without a heavy library
    const decodeToken = (token) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    };

    const handleLogout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        const portalUrl = window.config?.portal_url || 'http://localhost:5173';
        window.location.href = `${portalUrl}/login?expired=true`;
    }, []);

    const performRefresh = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.access_token) {
                    localStorage.setItem('token', data.access_token);
                    console.log("[AuthMonitor] Token refreshed proactively");
                }
            } else {
                console.warn("[AuthMonitor] Proactive refresh failed, logging out...");
                handleLogout();
            }
        } catch (error) {
            console.error("[AuthMonitor] Error during refresh:", error);
        }
    }, [handleLogout]);

    const checkTokenExpiry = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const decoded = decodeToken(token);
        if (!decoded || !decoded.exp) {
            console.warn("[AuthMonitor] Invalid token detected");
            return;
        }

        // Current time in seconds
        const currentTime = Math.floor(Date.now() / 1000);
        const timeLeft = decoded.exp - currentTime;

        // If expired
        if (timeLeft <= 0) {
            console.warn("[AuthMonitor] Token expired");
            handleLogout();
            return;
        }

        // If less than 5 minutes left, try proactive refresh
        if (timeLeft < 300) { 
            console.log(`[AuthMonitor] Token expiring soon (${Math.round(timeLeft)}s), refreshing...`);
            performRefresh();
        }
    }, [handleLogout, performRefresh]);

    useEffect(() => {
        // Initial check
        checkTokenExpiry();

        // Background check every 1 minute
        const interval = setInterval(checkTokenExpiry, 60000);

        return () => clearInterval(interval);
    }, [checkTokenExpiry, location.pathname]); // Re-check on navigation too

    return <>{children}</>;
};

export default AuthMonitor;
