import { Tabs, useRouter } from 'expo-router';
import { Calendar, Home, ScanLine } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { authService } from '../../services/auth.service';

export default function StaffLayout() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkStaffAccess();
    }, []);

    const checkStaffAccess = async () => {
        try {
            const isAuthenticated = await authService.checkAuth();
            if (!isAuthenticated) {
                router.replace('/');
                return;
            }

            // Check if user has any events as staff
            const staffEvents = await authService.getMyStaffEvents();
            const hasStaffAccess = staffEvents.length > 0;

            if (!hasStaffAccess) {
                router.replace('/(student)/home');
                return;
            }

            setIsLoading(false);
        } catch (error) {
            console.log('Staff access check failed:', error);
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
                tabBarActiveTintColor: '#10B981',
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
                name="scanner"
                options={{
                    title: 'Check-in',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.centerIcon, focused && styles.centerIconActive]}>
                            <ScanLine size={24} color={focused ? '#FFFFFF' : color} strokeWidth={2} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="event-detail"
                options={{
                    title: 'Event',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                            <Calendar size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
                        </View>
                    ),
                }}
            />
            {/* Hide fund-request from tabs but keep file for routing */}
            <Tabs.Screen
                name="fund-request"
                options={{
                    href: null, // Hide from tab bar
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
        backgroundColor: '#D1FAE5', // Green soft
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
        backgroundColor: '#10B981', // Green
    },
});
