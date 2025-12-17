import { useRouter } from 'expo-router';
import { ChevronRight, Clock, CreditCard, Edit3, FileText, HelpCircle, LogOut, Mail, Phone, QrCode, Settings, Shield, Ticket, User } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { authService } from '../../services/auth.service';

export default function ProfileScreen() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [hasStaffAccess, setHasStaffAccess] = useState(false);

    useEffect(() => {
        loadProfile();
        checkStaffAccess();
    }, []);

    const loadProfile = async () => {
        try {
            const { user: profile } = await authService.getProfile();
            setUser(profile);
        } catch (error) {
            console.log('Error loading profile:', error);
        }
    };

    const checkStaffAccess = async () => {
        try {
            const staffEvents = await authService.getMyStaffEvents();
            setHasStaffAccess(staffEvents.length > 0);
        } catch (error) {
            console.log('Error checking staff access:', error);
        }
    };

    const handleLogout = async () => {
        await authService.logout();
        router.replace('/');
    };

    const MenuItem = ({ icon: Icon, label, value, onPress, danger, highlight }: any) => (
        <TouchableOpacity
            className="flex-row items-center py-4 border-b border-border"
            onPress={onPress}
            activeOpacity={0.7}
            disabled={!onPress}
        >
            <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${danger ? 'bg-danger-soft' : highlight ? 'bg-success' : 'bg-background'}`}>
                <Icon size={20} color={danger ? COLORS.error : highlight ? '#FFF' : COLORS.textSecondary} />
            </View>
            <View className="flex-1">
                <Text className={`font-medium ${danger ? 'text-danger' : 'text-text'}`}>{label}</Text>
                {value && <Text className="text-text-secondary text-sm">{value}</Text>}
            </View>
            {!danger && onPress && <ChevronRight size={20} color={COLORS.border} />}
        </TouchableOpacity>
    );

    // Count active memberships
    const activeMemberships = (user?.memberships || []).filter((m: any) => m.status === 'ACTIVE').length;

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

                {/* Leader Mode Banner - Only show if user has leader role */}
                {(user?.memberships || []).some((m: any) => m.role === 'LEADER' && m.status === 'ACTIVE') && (
                    <TouchableOpacity
                        className="mx-5 mb-3 rounded-2xl p-4 flex-row items-center"
                        style={{ backgroundColor: '#7C3AED' }}
                        onPress={() => router.push('/(leader)/dashboard')}
                        activeOpacity={0.8}
                    >
                        <View className="w-12 h-12 bg-white/20 rounded-xl items-center justify-center mr-4">
                            <Shield size={24} color="#FFF" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-white font-bold text-base">Leader Mode</Text>
                            <Text className="text-white/80 text-sm">Manage club & approve members</Text>
                        </View>
                        <ChevronRight size={22} color="#FFF" />
                    </TouchableOpacity>
                )}

                {/* Staff Mode Banner - Only show if user is staff on any event */}
                {hasStaffAccess && (
                    <TouchableOpacity
                        className="mx-5 mb-6 bg-success rounded-2xl p-4 flex-row items-center"
                        onPress={() => router.push('/(staff)/dashboard')}
                        activeOpacity={0.8}
                    >
                        <View className="w-12 h-12 bg-white/20 rounded-xl items-center justify-center mr-4">
                            <QrCode size={24} color="#FFF" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-white font-bold text-base">Staff Mode</Text>
                            <Text className="text-white/80 text-sm">Check-in & manage events</Text>
                        </View>
                        <ChevronRight size={22} color="#FFF" />
                    </TouchableOpacity>
                )}

                {/* Profile Card with Edit */}
                <TouchableOpacity
                    className="mx-5 bg-card border border-border rounded-2xl p-5 mb-6"
                    onPress={() => router.push('/(student)/edit-profile')}
                    activeOpacity={0.8}
                >
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
                                <View className="bg-secondary-soft px-2 py-0.5 rounded mr-2">
                                    <Text className="text-secondary text-xs font-medium">
                                        {user?.auth_role || 'USER'}
                                    </Text>
                                </View>
                                {hasStaffAccess && (
                                    <View className="bg-success-soft px-2 py-0.5 rounded mr-2">
                                        <Text className="text-success text-xs font-medium">STAFF</Text>
                                    </View>
                                )}
                                {activeMemberships > 0 && (
                                    <View className="bg-primary-soft px-2 py-0.5 rounded">
                                        <Text className="text-primary text-xs font-medium">
                                            {activeMemberships} club{activeMemberships > 1 ? 's' : ''}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <View className="bg-background p-2 rounded-xl">
                            <Edit3 size={18} color={COLORS.primary} />
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Account Section */}
                <View className="mx-5 bg-card border border-border rounded-2xl px-4 mb-6">
                    <Text className="text-text-secondary text-xs font-medium uppercase pt-4 pb-2">Account</Text>
                    <MenuItem icon={Mail} label="Email" value={user?.email} />
                    <MenuItem icon={Phone} label="Phone" value={user?.phone || 'Not set'} />
                    <MenuItem icon={CreditCard} label="Student ID" value={user?.studentCode || 'Not set'} />
                </View>

                {/* Activity Section */}
                <View className="mx-5 bg-card border border-border rounded-2xl px-4 mb-6">
                    <Text className="text-text-secondary text-xs font-medium uppercase pt-4 pb-2">Activity</Text>
                    <MenuItem
                        icon={Ticket}
                        label="My Tickets"
                        value="View your event tickets"
                        onPress={() => router.push('/(student)/wallet')}
                    />
                    <MenuItem
                        icon={FileText}
                        label="My Applications"
                        value="Track your club applications"
                        onPress={() => router.push('/(student)/clubs/my-applications')}
                    />
                    <MenuItem
                        icon={Clock}
                        label="My Clubs"
                        value={activeMemberships > 0 ? `${activeMemberships} active membership${activeMemberships > 1 ? 's' : ''}` : 'Not joined any club'}
                        onPress={() => router.push('/(student)/clubs')}
                    />
                </View>

                {/* Settings Section */}
                <View className="mx-5 bg-card border border-border rounded-2xl px-4 mb-6">
                    <Text className="text-text-secondary text-xs font-medium uppercase pt-4 pb-2">Settings</Text>
                    <MenuItem icon={Settings} label="Edit Profile" onPress={() => router.push('/(student)/edit-profile')} />
                    <MenuItem icon={Shield} label="Privacy & Security" />
                    <MenuItem icon={HelpCircle} label="Help & Support" />
                </View>

                {/* Logout */}
                <View className="mx-5 bg-card border border-border rounded-2xl px-4 mb-8">
                    <MenuItem icon={LogOut} label="Log Out" danger onPress={handleLogout} />
                </View>

                {/* App Version */}
                <Text className="text-center text-text-secondary text-xs mb-8">
                    FPTU CLUB v1.0.0
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}
