import { Platform } from 'react-native';

// Use your Mac's IP address for device/simulator to connect to backend
// Replace with your actual IP if different
const DEV_API_URL = Platform.select({
    android: 'http://10.0.2.2:5001/api', // Android Emulator special IP
    ios: 'http://192.168.10.121:5001/api', // Mac's actual IP
    default: 'http://localhost:5001/api', // Web
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
