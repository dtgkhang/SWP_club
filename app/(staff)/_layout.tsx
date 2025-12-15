import { Tabs, useRouter } from 'expo-router';
import { FileText, Home, LogOut, QrCode, ScanLine, Settings } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { COLORS } from '../../constants/theme';
import { authService } from '../../services/auth.service';

const STAFF_ROLES = ['STAFF', 'LEADER', 'TREASURER'];

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

            // Check if user has staff role
            const { user } = await authService.getProfile();
            const hasStaffRole = user?.memberships?.some(
                (m: any) => STAFF_ROLES.includes(m.role) && m.status === 'ACTIVE'
            );

            if (!hasStaffRole) {
                // Not a staff, redirect to student area
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
                tabBarActiveTintColor: '#10B981', // Emerald green for staff
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
                    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.95)' : '#FFFFFF',
                    borderTopWidth: 0,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -8 },
                    shadowOpacity: 0.1,
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
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color, focused }) => (
                        <StaffTabIcon icon={Home} color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="scanner"
                options={{
                    title: 'Check-in',
                    tabBarIcon: ({ color, focused }) => (
                        <StaffTabIcon icon={ScanLine} color={color} focused={focused} isCenter />
                    ),
                }}
            />
            <Tabs.Screen
                name="fund-request"
                options={{
                    title: 'Funds',
                    tabBarIcon: ({ color, focused }) => (
                        <StaffTabIcon icon={FileText} color={color} focused={focused} />
                    ),
                }}
            />
        </Tabs>
    );
}

// Staff-specific Tab Icon with green theme
function StaffTabIcon({
    icon: Icon,
    color,
    focused,
    isCenter = false
}: {
    icon: any;
    color: string;
    focused: boolean;
    isCenter?: boolean;
}) {
    const scale = useSharedValue(1);

    useEffect(() => {
        if (focused) {
            scale.value = withSpring(1.12, { damping: 12, stiffness: 200 });
        } else {
            scale.value = withSpring(1, { damping: 12, stiffness: 200 });
        }
    }, [focused]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const activeColor = '#10B981'; // Emerald

    return (
        <Animated.View style={[styles.iconContainer, animatedStyle]}>
            <View style={[
                styles.iconBackground,
                focused && (isCenter ? styles.iconBackgroundCenter : styles.iconBackgroundActive)
            ]}>
                <Icon
                    size={isCenter && focused ? 24 : 22}
                    color={focused ? (isCenter ? '#FFFFFF' : activeColor) : color}
                    strokeWidth={focused ? 2.5 : 1.8}
                />
            </View>
            {focused && !isCenter && <View style={styles.indicator} />}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 52,
        height: 40,
    },
    iconBackground: {
        padding: 8,
        borderRadius: 14,
        backgroundColor: 'transparent',
    },
    iconBackgroundActive: {
        backgroundColor: '#D1FAE5', // Emerald-100
    },
    iconBackgroundCenter: {
        backgroundColor: '#10B981', // Emerald-500
        padding: 12,
        borderRadius: 16,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    indicator: {
        position: 'absolute',
        bottom: -4,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#10B981',
    },
});
