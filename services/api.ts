import { Platform } from 'react-native';

// Use localhost for iOS/Web and 10.0.2.2 for Android Emulator
const DEV_API_URL = Platform.select({
    android: 'http://10.0.2.2:3000/api',
    ios: 'http://localhost:3000/api',
    default: 'http://localhost:3000/api',
});

// TODO: Replace with environment variable if possible
const API_BASE_URL = DEV_API_URL;

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
    accessToken = token;
};

export const getAccessToken = () => accessToken;

interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
}

export const apiFn = async <T>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
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

        // Handle 401 Unauthorized globally if needed (e.g., logout)
        if (response.status === 401) {
            // clear token?
            // setAccessToken(null);
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
