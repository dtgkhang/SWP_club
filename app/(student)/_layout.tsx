import { Tabs, useRouter } from 'expo-router';
import { Compass, Home, Ticket, User, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { COLORS } from '../../constants/theme';
import { authService } from '../../services/auth.service';

export default function StudentLayout() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const isAuthenticated = await authService.checkAuth();
            if (!isAuthenticated) {
                router.replace('/');
                return;
            }
            setIsLoading(false);
        } catch (error) {
            console.log('Auth check failed:', error);
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
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: '#94A3B8',
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: Platform.OS === 'ios' ? 90 : 72,
                    paddingTop: 8,
                    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
                    paddingHorizontal: 8,
                    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.92)' : '#FFFFFF',
                    borderTopWidth: 0,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -8 },
                    shadowOpacity: 0.08,
                    shadowRadius: 24,
                    elevation: 24,
                },
                tabBarItemStyle: {
                    paddingVertical: 4,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginTop: 2,
                    letterSpacing: 0.2,
                },
                tabBarIconStyle: {
                    marginBottom: 0,
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon icon={Home} color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="clubs"
                options={{
                    title: 'Clubs',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon icon={Users} color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="wallet"
                options={{
                    title: 'Tickets',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon icon={Ticket} color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon icon={User} color={color} focused={focused} />
                    ),
                }}
            />
            {/* Hidden screens */}
            <Tabs.Screen
                name="events/[id]"
                options={{
                    href: null,
                    tabBarStyle: { display: 'none' },
                }}
            />
            <Tabs.Screen
                name="payment"
                options={{
                    href: null,
                    tabBarStyle: { display: 'none' },
                }}
            />
            <Tabs.Screen
                name="edit-profile"
                options={{
                    href: null,
                    tabBarStyle: { display: 'none' },
                }}
            />
        </Tabs>
    );
}

// Animated Tab Icon Component
function TabIcon({ icon: Icon, color, focused }: { icon: any; color: string; focused: boolean }) {
    const scale = useSharedValue(1);

    useEffect(() => {
        if (focused) {
            scale.value = withSpring(1.15, { damping: 12, stiffness: 200 });
        } else {
            scale.value = withSpring(1, { damping: 12, stiffness: 200 });
        }
    }, [focused]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View style={[styles.iconContainer, animatedStyle]}>
            <View style={[
                styles.iconBackground,
                focused && styles.iconBackgroundActive
            ]}>
                <Icon
                    size={22}
                    color={focused ? COLORS.primary : color}
                    strokeWidth={focused ? 2.5 : 1.8}
                />
            </View>
            {focused && <View style={styles.indicator} />}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 48,
        height: 36,
    },
    iconBackground: {
        padding: 6,
        borderRadius: 12,
        backgroundColor: 'transparent',
    },
    iconBackgroundActive: {
        backgroundColor: COLORS.primarySoft,
    },
    indicator: {
        position: 'absolute',
        bottom: -6,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.primary,
    },
});
