import { useRouter } from 'expo-router';
import { Calendar, ChevronRight, Crown, FileText, RefreshCw, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { authService } from '../../services/auth.service';
import api from '../../services/api';

interface ClubStats {
    members: number;
    pendingApplications: number;
    events: number;
}

export default function LeaderDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [club, setClub] = useState<any>(null);
    const [stats, setStats] = useState<ClubStats>({ members: 0, pendingApplications: 0, events: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load user profile
            const { user: profile } = await authService.getProfile();
            setUser(profile);

            // Get leader's club from memberships
            const leaderMembership = profile?.memberships?.find(
                (m: any) => m.role === 'LEADER' && m.status === 'ACTIVE'
            );

            if (leaderMembership?.clubId) {
                // Load club detail
                const clubResponse = await api<{ success: boolean; data: any }>(
                    `/clubs/${leaderMembership.clubId}`
                );
                setClub(clubResponse.data);

                // Load members count
                const membersResponse = await api<{ success: boolean; data: any }>(
                    `/clubs/${leaderMembership.clubId}/members?limit=1`
                );

                // Load pending applications
                const applicationsResponse = await api<{ success: boolean; data: any }>(
                    `/clubs/${leaderMembership.clubId}/applications?status=PENDING`
                );

                // Load events count
                const eventsResponse = await api<{ success: boolean; data: any[] }>(
                    `/events?clubId=${leaderMembership.clubId}`
                );

                setStats({
                    members: membersResponse.data?.pagination?.total || clubResponse.data?._count?.memberships || 0,
                    pendingApplications: applicationsResponse.data?.pagination?.total || applicationsResponse.data?.length || 0,
                    events: eventsResponse.data?.length || 0,
                });
            }
        } catch (error) {
            console.log('Error loading leader data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-background justify-center items-center">
                <ActivityIndicator size="large" color="#7C3AED" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />
                }
            >
                {/* Header */}
                <View className="px-5 pt-4 pb-6">
                    <View className="flex-row justify-between items-center">
                        <View>
                            <Text className="text-text-secondary text-sm">Leader Dashboard</Text>
                            <Text className="text-text text-2xl font-bold">{club?.name || 'My Club'}</Text>
                        </View>
                        <TouchableOpacity
                            className="bg-gray-100 px-4 py-2.5 rounded-xl"
                            onPress={() => router.replace('/(student)/profile')}
                        >
                            <Text className="text-gray-600 font-medium text-sm">Exit</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Club Card */}
                <View className="mx-5 mb-6 bg-gradient-to-br from-purple-600 to-purple-700 rounded-3xl p-5" style={{ backgroundColor: '#7C3AED' }}>
                    <View className="flex-row items-center mb-4">
                        <View className="w-14 h-14 bg-white/20 rounded-2xl items-center justify-center mr-4">
                            <Crown size={28} color="#FFF" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-white/80 text-sm">You are the Leader of</Text>
                            <Text className="text-white text-xl font-bold">{club?.name || 'Your Club'}</Text>
                        </View>
                    </View>
                    <View className="flex-row">
                        <View className="flex-1 bg-white/10 rounded-xl p-3 mr-2">
                            <Text className="text-white/70 text-xs">Members</Text>
                            <Text className="text-white text-2xl font-bold">{stats.members}</Text>
                        </View>
                        <View className="flex-1 bg-white/10 rounded-xl p-3 mr-2">
                            <Text className="text-white/70 text-xs">Pending</Text>
                            <Text className="text-white text-2xl font-bold">{stats.pendingApplications}</Text>
                        </View>
                        <View className="flex-1 bg-white/10 rounded-xl p-3">
                            <Text className="text-white/70 text-xs">Events</Text>
                            <Text className="text-white text-2xl font-bold">{stats.events}</Text>
                        </View>
                    </View>
                </View>

                {/* Quick Actions */}
                <View className="px-5 mb-6">
                    <Text className="text-text font-bold text-lg mb-3">Quick Actions</Text>

                    {/* Pending Applications Alert */}
                    {stats.pendingApplications > 0 && (
                        <TouchableOpacity
                            className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-3 flex-row items-center"
                            onPress={() => router.push('/(leader)/applications')}
                        >
                            <View className="w-12 h-12 bg-orange-100 rounded-xl items-center justify-center mr-4">
                                <FileText size={24} color="#F97316" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-orange-800 font-bold">{stats.pendingApplications} Pending Applications</Text>
                                <Text className="text-orange-600 text-sm">Tap to review and approve</Text>
                            </View>
                            <ChevronRight size={20} color="#F97316" />
                        </TouchableOpacity>
                    )}

                    {/* Action Cards */}
                    <View className="flex-row">
                        <TouchableOpacity
                            className="flex-1 bg-card border border-border rounded-2xl p-4 mr-2 items-center"
                            onPress={() => router.push('/(leader)/applications')}
                        >
                            <View className="w-12 h-12 bg-purple-100 rounded-xl items-center justify-center mb-2">
                                <FileText size={24} color="#7C3AED" />
                            </View>
                            <Text className="text-text font-bold">Applications</Text>
                            <Text className="text-text-secondary text-xs">Review requests</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-1 bg-card border border-border rounded-2xl p-4 ml-2 items-center"
                            onPress={() => router.push('/(leader)/members')}
                        >
                            <View className="w-12 h-12 bg-blue-100 rounded-xl items-center justify-center mb-2">
                                <Users size={24} color="#2563EB" />
                            </View>
                            <Text className="text-text font-bold">Members</Text>
                            <Text className="text-text-secondary text-xs">Manage team</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Club Info */}
                <View className="px-5">
                    <Text className="text-text font-bold text-lg mb-3">Club Info</Text>
                    <View className="bg-card border border-border rounded-2xl p-4">
                        <View className="flex-row items-center mb-3 pb-3 border-b border-border">
                            <Text className="text-text-secondary flex-1">Description</Text>
                            <Text className="text-text font-medium flex-2 text-right" numberOfLines={2}>
                                {club?.description || 'No description'}
                            </Text>
                        </View>
                        <View className="flex-row items-center mb-3 pb-3 border-b border-border">
                            <Text className="text-text-secondary flex-1">Membership Fee</Text>
                            <Text className="text-text font-medium">
                                {club?.membershipFee ? `${club.membershipFee.toLocaleString()}₫` : 'Free'}
                            </Text>
                        </View>
                        <View className="flex-row items-center">
                            <Text className="text-text-secondary flex-1">Status</Text>
                            <View className="bg-success-soft px-3 py-1 rounded-lg">
                                <Text className="text-success font-bold text-sm">Active</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
