import { Tabs, useRouter } from 'expo-router';
import { Home, ScanLine, User, Users, Wallet } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { COLORS } from '../../constants/theme';
import { authService } from '../../services/auth.service';

const STAFF_ROLES = ['STAFF', 'LEADER', 'TREASURER', 'ADMIN'];

export default function StudentLayout() {
    const router = useRouter();
    const [hasStaffRole, setHasStaffRole] = useState(false);

    useEffect(() => {
        checkAuthAndRole();
    }, []);

    const checkAuthAndRole = async () => {
        try {
            const isAuthenticated = await authService.checkAuth();
            if (!isAuthenticated) {
                router.replace('/');
                return;
            }

            const { user } = await authService.getProfile();
            const isStaff = user?.memberships?.some(m =>
                STAFF_ROLES.includes(m.role) && m.status === 'ACTIVE'
            );
            setHasStaffRole(!!isStaff);
        } catch (error) {
            console.log('Auth check failed:', error);
            router.replace('/');
        }
    };

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
                    height: Platform.OS === 'ios' ? 88 : 70,
                    paddingTop: 12,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: 0,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.08,
                    shadowRadius: 12,
                    elevation: 20,
                },
                tabBarItemStyle: {
                    paddingVertical: 4,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginTop: 4,
                },
                tabBarIconStyle: {
                    marginBottom: -2,
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Discover',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={{
                            backgroundColor: focused ? COLORS.primarySoft : 'transparent',
                            padding: 8,
                            borderRadius: 12,
                        }}>
                            <Home size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="clubs"
                options={{
                    title: 'Clubs',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={{
                            backgroundColor: focused ? COLORS.primarySoft : 'transparent',
                            padding: 8,
                            borderRadius: 12,
                        }}>
                            <Users size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="scanner"
                options={{
                    title: 'Check-in',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={{
                            backgroundColor: focused ? COLORS.primarySoft : 'transparent',
                            padding: 8,
                            borderRadius: 12,
                        }}>
                            <ScanLine size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
                        </View>
                    ),
                    href: hasStaffRole ? undefined : null,
                }}
            />
            <Tabs.Screen
                name="wallet"
                options={{
                    title: 'Tickets',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={{
                            backgroundColor: focused ? COLORS.primarySoft : 'transparent',
                            padding: 8,
                            borderRadius: 12,
                        }}>
                            <Wallet size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={{
                            backgroundColor: focused ? COLORS.primarySoft : 'transparent',
                            padding: 8,
                            borderRadius: 12,
                        }}>
                            <User size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
                        </View>
                    ),
                }}
            />
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
        </Tabs>
    );
}
