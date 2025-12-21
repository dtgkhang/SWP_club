import { Tabs, useRouter } from 'expo-router';
import { FileText, Home, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useCache } from '../../contexts/CacheContext';
import { authService } from '../../services/auth.service';

export default function LeaderLayout() {
    const router = useRouter();
    const cache = useCache();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkLeaderAccess();
    }, []);

    const checkLeaderAccess = async () => {
        try {
            const isAuthenticated = await authService.checkAuth();
            if (!isAuthenticated) {
                router.replace('/');
                return;
            }

            // Check cached profile first for instant access
            if (cache.userProfile) {
                const hasLeaderRole = cache.userProfile.memberships?.some(
                    (m: any) => m.role === 'LEADER' && m.status === 'ACTIVE'
                );
                if (hasLeaderRole) {
                    setIsLoading(false);
                    // Refresh profile in background
                    cache.fetchProfile();
                    return;
                }
            }

            // No cache, fetch fresh
            const profile = await cache.fetchProfile(true);
            const hasLeaderRole = profile?.memberships?.some(
                (m: any) => m.role === 'LEADER' && m.status === 'ACTIVE'
            );

            if (!hasLeaderRole) {
                router.replace('/(student)/profile');
                return;
            }

            setIsLoading(false);
        } catch (error) {
            console.log('Leader access check failed:', error);
            router.replace('/');
        }
    };

    if (isLoading) {
        return null;
    }

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#7C3AED',
                tabBarInactiveTintColor: '#94A3B8',
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: Platform.OS === 'ios' ? 85 : 65,
                    paddingTop: 10,
                    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: 1,
                    borderTopColor: '#F1F5F9',
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '500',
                    marginTop: 4,
                },
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                            <Home size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="applications"
                options={{
                    title: 'Applications',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.centerIcon, focused && styles.centerIconActive]}>
                            <FileText size={24} color={focused ? '#FFFFFF' : color} strokeWidth={2} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="members"
                options={{
                    title: 'Members',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                            <Users size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    iconWrap: {
        width: 40,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
    },
    iconWrapActive: {
        backgroundColor: '#EDE9FE', // Purple soft
    },
    centerIcon: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 24,
        backgroundColor: '#E5E7EB',
        marginBottom: 10,
    },
    centerIconActive: {
        backgroundColor: '#7C3AED', // Purple
    },
});
