'use client';

import { createContext, useContext, useState, useRef, useCallback } from 'react';

const DURATION = {
    success: 3000,
    error: 8000,
    warning: 5000,
    info: 4000
};

const NotificationContext = createContext(() => {});

export function NotificationProvider({ children }) {
    const [notification, setNotification] = useState({ message: '', type: 'info', visible: false });
    const timerRef = useRef(null);

    const showNotification = useCallback((message, type = 'info') => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setNotification({ message, type, visible: true });
        timerRef.current = setTimeout(() => {
            setNotification(prev => ({ ...prev, visible: false }));
        }, DURATION[type] || 4000);
    }, []);

    return (
        <NotificationContext.Provider value={showNotification}>
            {children}
            <div className={`notification ${notification.type} ${notification.visible ? 'show' : ''}`}>
                {notification.message}
            </div>
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    return useContext(NotificationContext);
}
