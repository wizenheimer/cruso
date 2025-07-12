'use client';

import { useState, useEffect } from 'react';
import { CalendarConnection, GoogleAccount, AvailabilityResponse } from '@/client/calendar';
import { calendarClient } from '@/client/calendar';

/**
 * useCalendarConnections is a hook that fetches the user's calendar connections.
 * @returns The user's calendar connections.
 */
export function useCalendarConnections() {
    const [connections, setConnections] = useState<CalendarConnection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchConnections = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await calendarClient.getConnections();
            setConnections(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch connections');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConnections();
    }, []);

    const updateConnection = async (id: number, updates: Partial<CalendarConnection>) => {
        try {
            await calendarClient.updateConnection(id, updates);
            setConnections((prev) =>
                prev.map((conn) => (conn.id === id ? { ...conn, ...updates } : conn)),
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update connection');
            throw err;
        }
    };

    const removeAccount = async (accountId: string) => {
        try {
            await calendarClient.removeAccount(accountId);
            // Refresh the connections list since we removed an entire account
            await fetchConnections();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove account');
            throw err;
        }
    };

    const syncConnection = async (id: number) => {
        try {
            await calendarClient.syncConnection(id);
            await fetchConnections(); // Refresh the list
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to sync connection');
            throw err;
        }
    };

    return {
        connections,
        loading,
        error,
        fetchConnections,
        updateConnection,
        removeAccount,
        syncConnection,
    };
}

/**
 * useGoogleAccounts is a hook that fetches the user's Google accounts.
 * @returns The user's Google accounts.
 */
export function useGoogleAccounts() {
    const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await calendarClient.getGoogleAccounts();
            setAccounts(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch Google accounts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    return {
        accounts,
        loading,
        error,
        fetchAccounts,
    };
}

/**
 * useAvailabilityCheck is a hook that checks the user's availability.
 * @returns The user's availability.
 */
export function useAvailabilityCheck() {
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkAvailability = async (
        startTime: string,
        endTime: string,
    ): Promise<AvailabilityResponse | null> => {
        try {
            setChecking(true);
            setError(null);
            const result = await calendarClient.checkAvailability({
                startTime,
                endTime,
            });
            return result;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to check availability');
            return null;
        } finally {
            setChecking(false);
        }
    };

    return {
        checkAvailability,
        checking,
        error,
    };
}
