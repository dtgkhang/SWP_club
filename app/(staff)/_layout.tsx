import { Tabs } from 'expo-router';
import { FileText, LayoutDashboard, ScanLine } from 'lucide-react-native';
import { COLORS } from '../../constants/theme';

export default function StaffLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: COLORS.secondary,
                tabBarInactiveTintColor: COLORS.textLight,
                tabBarStyle: {
                    borderTopWidth: 1,
                    borderTopColor: '#F3F4F6', // gray-100
                    elevation: 5,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    height: 60,
                    paddingBottom: 10,
                    paddingTop: 10,
                    backgroundColor: '#FFFFFF',
                },
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="scanner"
                options={{
                    title: 'Check-in',
                    tabBarIcon: ({ color, size }) => <ScanLine color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="fund-request"
                options={{
                    title: 'Fund Request',
                    tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
                }}
            />
        </Tabs>
    );
}
