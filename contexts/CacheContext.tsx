import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { authService } from '../services/auth.service';
import { Club, clubService } from '../services/club.service';
import { Event, eventService } from '../services/event.service';

// Types
interface CacheError {
    type: 'events' | 'clubs' | 'profile' | 'staffEvents';
    message: string;
    timestamp: number;
}

interface CacheContextType {
    // Events
    events: Event[];
    fetchEvents: (force?: boolean) => Promise<Event[]>;
    isEventsStale: () => boolean;
    eventsLoading: boolean;

    // Clubs
    clubs: Club[];
    fetchClubs: (force?: boolean) => Promise<Club[]>;
    isClubsStale: () => boolean;
    clubsLoading: boolean;

    // Profile
    userProfile: any;
    setUserProfile: (profile: any) => void;
    fetchProfile: (force?: boolean) => Promise<any>;
    isProfileStale: () => boolean;
    profileLoading: boolean;

    // Staff Events
    staffEvents: any[];
    hasStaffAccess: boolean;
    fetchStaffEvents: (force?: boolean) => Promise<any[]>;
    isStaffEventsStale: () => boolean;

    // Cache control & errors
    clearCache: () => void;
    isCacheWarm: boolean;
    lastError: CacheError | null;
    clearError: () => void;
}

// Constants
const CACHE_TTL = 60 * 1000; // 1 minute TTL for stale check
const PROFILE_TTL = 5 * 60 * 1000; // 5 minutes for profile/staff events
const MAX_RETRY_COUNT = 2;

const CacheContext = createContext<CacheContextType | null>(null);

export function CacheProvider({ children }: { children: React.ReactNode }) {
    // State
    const [events, setEvents] = useState<Event[]>([]);
    const [clubs, setClubs] = useState<Club[]>([]);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [staffEvents, setStaffEvents] = useState<any[]>([]);

    // Loading states
    const [eventsLoading, setEventsLoading] = useState(false);
    const [clubsLoading, setClubsLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);

    // Error tracking
    const [lastError, setLastError] = useState<CacheError | null>(null);
    const retryCount = useRef({ events: 0, clubs: 0, profile: 0, staffEvents: 0 });

    const timestamps = useRef({
        events: null as number | null,
        clubs: null as number | null,
        profile: null as number | null,
        staffEvents: null as number | null,
    });

    // Stale checkers
    const isEventsStale = useCallback(() => {
        if (!timestamps.current.events) return true;
        return Date.now() - timestamps.current.events > CACHE_TTL;
    }, []);

    const isClubsStale = useCallback(() => {
        if (!timestamps.current.clubs) return true;
        return Date.now() - timestamps.current.clubs > CACHE_TTL;
    }, []);

    const isProfileStale = useCallback(() => {
        if (!timestamps.current.profile) return true;
        return Date.now() - timestamps.current.profile > PROFILE_TTL;
    }, []);

    const isStaffEventsStale = useCallback(() => {
        if (!timestamps.current.staffEvents) return true;
        return Date.now() - timestamps.current.staffEvents > PROFILE_TTL;
    }, []);

    // Safe array checker
    const ensureArray = <T,>(data: T[] | undefined | null): T[] => {
        if (!data) return [];
        if (!Array.isArray(data)) return [];
        return data;
    };

    // Fetch Events with error handling
    const fetchEvents = useCallback(async (force = false): Promise<Event[]> => {
        // Return cached if valid
        if (!force && events.length > 0 && !isEventsStale()) {
            return events;
        }

        // Prevent duplicate calls
        if (eventsLoading) return events;

        setEventsLoading(true);
        try {
            const data = await eventService.getAllEvents();
            const safeData = ensureArray(data);
            setEvents(safeData);
            timestamps.current.events = Date.now();
            retryCount.current.events = 0; // Reset retry on success
            return safeData;
        } catch (error: any) {
            console.warn('Cache: Error fetching events:', error?.message || error);
            retryCount.current.events++;

            // Only set error if we have no cached data to fall back to
            if (events.length === 0) {
                setLastError({
                    type: 'events',
                    message: error?.message || 'Failed to fetch events',
                    timestamp: Date.now(),
                });
            }
            return events; // Return stale/empty data
        } finally {
            setEventsLoading(false);
        }
    }, [events, isEventsStale, eventsLoading]);

    // Fetch Clubs with error handling
    const fetchClubs = useCallback(async (force = false): Promise<Club[]> => {
        if (!force && clubs.length > 0 && !isClubsStale()) {
            return clubs;
        }

        if (clubsLoading) return clubs;

        setClubsLoading(true);
        try {
            const result = await clubService.getAllClubs(1, 100);
            const safeData = ensureArray(result?.clubs);
            setClubs(safeData);
            timestamps.current.clubs = Date.now();
            retryCount.current.clubs = 0;
            return safeData;
        } catch (error: any) {
            console.warn('Cache: Error fetching clubs:', error?.message || error);
            retryCount.current.clubs++;

            if (clubs.length === 0) {
                setLastError({
                    type: 'clubs',
                    message: error?.message || 'Failed to fetch clubs',
                    timestamp: Date.now(),
                });
            }
            return clubs;
        } finally {
            setClubsLoading(false);
        }
    }, [clubs, isClubsStale, clubsLoading]);

    // Fetch Profile with error handling
    const fetchProfile = useCallback(async (force = false): Promise<any> => {
        if (!force && userProfile && !isProfileStale()) {
            return userProfile;
        }

        if (profileLoading) return userProfile;

        setProfileLoading(true);
        try {
            const { user: profile } = await authService.getProfile();
            if (profile) {
                setUserProfile(profile);
                timestamps.current.profile = Date.now();
                retryCount.current.profile = 0;
            }
            return profile || userProfile;
        } catch (error: any) {
            console.warn('Cache: Error fetching profile:', error?.message || error);
            retryCount.current.profile++;

            if (!userProfile) {
                setLastError({
                    type: 'profile',
                    message: error?.message || 'Failed to fetch profile',
                    timestamp: Date.now(),
                });
            }
            return userProfile;
        } finally {
            setProfileLoading(false);
        }
    }, [userProfile, isProfileStale, profileLoading]);

    // Fetch Staff Events with error handling
    const fetchStaffEvents = useCallback(async (force = false): Promise<any[]> => {
        if (!force && staffEvents.length > 0 && !isStaffEventsStale()) {
            return staffEvents;
        }

        try {
            const events = await authService.getMyStaffEvents();
            const safeData = ensureArray(events);
            setStaffEvents(safeData);
            timestamps.current.staffEvents = Date.now();
            retryCount.current.staffEvents = 0;
            return safeData;
        } catch (error: any) {
            console.warn('Cache: Error fetching staff events:', error?.message || error);
            retryCount.current.staffEvents++;
            // Staff events failure is not critical - user can still use app
            return staffEvents;
        }
    }, [staffEvents, isStaffEventsStale]);

    // Clear all cache
    const clearCache = useCallback(() => {
        setEvents([]);
        setClubs([]);
        setUserProfile(null);
        setStaffEvents([]);
        setLastError(null);
        timestamps.current = { events: null, clubs: null, profile: null, staffEvents: null };
        retryCount.current = { events: 0, clubs: 0, profile: 0, staffEvents: 0 };
    }, []);

    // Clear error
    const clearError = useCallback(() => {
        setLastError(null);
    }, []);

    // Computed values
    const hasStaffAccess = staffEvents.length > 0;
    const isCacheWarm = events.length > 0 || clubs.length > 0;

    return (
        <CacheContext.Provider
            value={{
                events,
                fetchEvents,
                isEventsStale,
                eventsLoading,
                clubs,
                fetchClubs,
                isClubsStale,
                clubsLoading,
                userProfile,
                setUserProfile,
                fetchProfile,
                isProfileStale,
                profileLoading,
                staffEvents,
                hasStaffAccess,
                fetchStaffEvents,
                isStaffEventsStale,
                clearCache,
                isCacheWarm,
                lastError,
                clearError,
            }}
        >
            {children}
        </CacheContext.Provider>
    );
}

export function useCache() {
    const context = useContext(CacheContext);
    if (!context) {
        throw new Error('useCache must be used within a CacheProvider');
    }
    return context;
}

// Safe hook wrapper - never throws, always returns safe defaults
export function useSafeCache(): CacheContextType | null {
    try {
        return useContext(CacheContext);
    } catch {
        return null;
    }
}

// Hook for optimistic data loading
export function useCachedEvents() {
    const cache = useCache();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [localEvents, setLocalEvents] = useState<Event[]>(cache.events);

    const load = useCallback(async (force = false) => {
        setError(null);

        // Show cached data immediately
        if (cache.events.length > 0) {
            setLocalEvents(cache.events);
        }

        if (force || cache.isEventsStale()) {
            setLoading(true);
            try {
                const fresh = await cache.fetchEvents(force);
                setLocalEvents(fresh);
                if (fresh.length === 0 && cache.lastError?.type === 'events') {
                    setError(cache.lastError.message);
                }
            } catch (err: any) {
                setError(err?.message || 'Failed to load events');
            } finally {
                setLoading(false);
            }
        }
    }, [cache]);

    return {
        events: localEvents,
        loading: loading || cache.eventsLoading,
        error,
        load,
        isStale: cache.isEventsStale()
    };
}

export function useCachedClubs() {
    const cache = useCache();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [localClubs, setLocalClubs] = useState<Club[]>(cache.clubs);

    const load = useCallback(async (force = false) => {
        setError(null);

        if (cache.clubs.length > 0) {
            setLocalClubs(cache.clubs);
        }

        if (force || cache.isClubsStale()) {
            setLoading(true);
            try {
                const fresh = await cache.fetchClubs(force);
                setLocalClubs(fresh);
                if (fresh.length === 0 && cache.lastError?.type === 'clubs') {
                    setError(cache.lastError.message);
                }
            } catch (err: any) {
                setError(err?.message || 'Failed to load clubs');
            } finally {
                setLoading(false);
            }
        }
    }, [cache]);

    return {
        clubs: localClubs,
        loading: loading || cache.clubsLoading,
        error,
        load,
        isStale: cache.isClubsStale()
    };
}


