import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import Constants from 'expo-constants';

const getBaseUrl = () => {
    const debuggerHost = Constants.expoConfig?.hostUri;
    const localhost = debuggerHost?.split(':')[0];

    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:5001/api';
    }

    if (localhost) {
        return `http://${localhost}:5001/api`;
    }

    return 'http://localhost:5001/api';
};

const DEV_API_URL = getBaseUrl();

// ========== NGROK CONFIGURATION ==========
// Set USE_NGROK = true when testing on real device over 4G/mobile network
// Set USE_NGROK = false when developing locally on simulator/emulator
const USE_NGROK = true;
const NGROK_URL = 'https://glyptic-katherina-unpreferably.ngrok-free.dev/api';
// ==========================================

const API_BASE_URL = USE_NGROK ? NGROK_URL : DEV_API_URL;
const TOKEN_KEY = '@fpt_ucms_token';

let accessToken: string | null = null;

// Initialize token from storage
export const initializeToken = async (): Promise<string | null> => {
    try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
            accessToken = token;
        }
        return token;
    } catch (error) {
        console.error('Error loading token:', error);
        return null;
    }
};

export const setAccessToken = async (token: string | null) => {
    accessToken = token;
    try {
        if (token) {
            await AsyncStorage.setItem(TOKEN_KEY, token);
        } else {
            await AsyncStorage.removeItem(TOKEN_KEY);
        }
    } catch (error) {
        console.error('Error saving token:', error);
    }
};

export const getAccessToken = () => accessToken;

export const clearAccessToken = async () => {
    accessToken = null;
    try {
        await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (error) {
        console.error('Error clearing token:', error);
    }
};

interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
}

export const apiFn = async <T>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning page
        ...options.headers,
    };

    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            await clearAccessToken();
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error || `Error ${response.status}`);
        }

        return data as T;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

export default apiFn;
