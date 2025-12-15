import { useRouter } from 'expo-router';
import { ChevronRight, CreditCard, HelpCircle, LogOut, Mail, Phone, Settings, Shield, User } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { authService } from '../../services/auth.service';

export default function ProfileScreen() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const { user: profile } = await authService.getProfile();
            setUser(profile);
        } catch (error) {
            console.log('Error loading profile:', error);
        }
    };

    const handleLogout = async () => {
        await authService.logout();
        router.replace('/');
    };

    const MenuItem = ({ icon: Icon, label, value, onPress, danger }: any) => (
        <TouchableOpacity
            className="flex-row items-center py-4 border-b border-border"
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${danger ? 'bg-danger-soft' : 'bg-background'}`}>
                <Icon size={20} color={danger ? COLORS.error : COLORS.textSecondary} />
            </View>
            <View className="flex-1">
                <Text className={`font-medium ${danger ? 'text-danger' : 'text-text'}`}>{label}</Text>
                {value && <Text className="text-text-secondary text-sm">{value}</Text>}
            </View>
            {!danger && <ChevronRight size={20} color={COLORS.border} />}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Header */}
                <View className="px-5 pt-2 pb-6">
                    <Text className="text-text text-2xl font-bold">Profile</Text>
                </View>

                {/* Profile Card */}
                <View className="mx-5 bg-card border border-border rounded-2xl p-5 mb-6">
                    <View className="flex-row items-center">
                        <View className="w-16 h-16 bg-primary-soft rounded-2xl items-center justify-center mr-4">
                            <Text className="text-primary text-2xl font-bold">
                                {(user?.fullName || 'U').charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-text text-lg font-bold">{user?.fullName || 'Loading...'}</Text>
                            <Text className="text-text-secondary text-sm">{user?.email || ''}</Text>
                            <View className="flex-row items-center mt-1">
                                <View className="bg-secondary-soft px-2 py-0.5 rounded">
                                    <Text className="text-secondary text-xs font-medium">
                                        {user?.auth_role || 'USER'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Account Section */}
                <View className="mx-5 bg-card border border-border rounded-2xl px-4 mb-6">
                    <Text className="text-text-secondary text-xs font-medium uppercase pt-4 pb-2">Account</Text>
                    <MenuItem icon={Mail} label="Email" value={user?.email} />
                    <MenuItem icon={Phone} label="Phone" value={user?.phone || 'Not set'} />
                    <MenuItem icon={CreditCard} label="Student ID" value={user?.studentCode || 'Not set'} />
                </View>

                {/* Settings Section */}
                <View className="mx-5 bg-card border border-border rounded-2xl px-4 mb-6">
                    <Text className="text-text-secondary text-xs font-medium uppercase pt-4 pb-2">Settings</Text>
                    <MenuItem icon={Settings} label="Preferences" />
                    <MenuItem icon={Shield} label="Privacy & Security" />
                    <MenuItem icon={HelpCircle} label="Help & Support" />
                </View>

                {/* Logout */}
                <View className="mx-5 bg-card border border-border rounded-2xl px-4 mb-8">
                    <MenuItem icon={LogOut} label="Log Out" danger onPress={handleLogout} />
                </View>

                {/* App Version */}
                <Text className="text-center text-text-secondary text-xs mb-8">
                    FPT UCMS v1.0.0
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}
