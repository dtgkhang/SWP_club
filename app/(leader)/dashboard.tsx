import { useFocusEffect, useRouter } from 'expo-router';
import { Calendar, ChevronRight, Crown, FileText, Users } from 'lucide-react-native';
import { useCallback, useState } from 'react';
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
    const [stats, setStats] = useState<ClubStats>({
        members: 0,
        pendingApplications: 0,
        events: 0,
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        try {
            if (!refreshing) setLoading(true);

            const { user: profile } = await authService.getProfile();
            setUser(profile);

            const leaderMembership = profile?.memberships?.find(
                (m: any) => m.role === 'LEADER' && m.status === 'ACTIVE'
            );

            if (leaderMembership?.clubId) {
                const clubId = leaderMembership.clubId;

                // Parallel API calls
                const [clubRes, membersRes, appsRes, eventsRes] = await Promise.all([
                    api<{ success: boolean; data: any }>(`/clubs/${clubId}`),
                    api<{ success: boolean; data: any; pagination?: any }>(`/clubs/${clubId}/members?limit=1`),
                    api<{ success: boolean; data: any; pagination?: any }>(`/clubs/${clubId}/applications?status=PENDING`),
                    api<{ success: boolean; data: any[] }>(`/events?clubId=${clubId}&includePending=true`),
                ]);

                setClub(clubRes.data);

                setStats({
                    members: membersRes.pagination?.total || clubRes.data?._count?.memberships || 0,
                    pendingApplications: appsRes.pagination?.total || appsRes.data?.length || 0,
                    events: eventsRes.data?.length || 0,
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
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text className="text-text-secondary mt-4">Loading dashboard...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
            >
                {/* Header */}
                <View className="px-5 pt-4 pb-2">
                    <View className="flex-row justify-between items-center">
                        <View>
                            <Text className="text-text-secondary text-sm">Welcome back,</Text>
                            <Text className="text-text text-2xl font-bold">{user?.fullName || 'Leader'}</Text>
                        </View>
                        <TouchableOpacity
                            className="bg-gray-100 px-4 py-2.5 rounded-full"
                            onPress={() => router.replace('/(student)/profile')}
                        >
                            <Text className="text-gray-600 font-semibold text-sm">Exit</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Club Hero Card */}
                <View className="mx-5 mt-4 rounded-3xl overflow-hidden" style={{ backgroundColor: COLORS.primary }}>
                    <View className="p-5">
                        <View className="flex-row items-center mb-4">
                            <View className="w-14 h-14 bg-white/20 rounded-2xl items-center justify-center mr-4">
                                <Crown size={28} color="#FFF" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-white/80 text-sm">You're leading</Text>
                                <Text className="text-white text-xl font-bold" numberOfLines={1}>
                                    {club?.name || 'Your Club'}
                                </Text>
                            </View>
                        </View>

                        {/* Stats Grid */}
                        <View className="flex-row flex-wrap -mx-1">
                            <View className="w-1/2 px-1 mb-2">
                                <View className="bg-white/15 rounded-2xl p-3">
                                    <View className="flex-row items-center mb-1">
                                        <Users size={14} color="#FFF" />
                                        <Text className="text-white/70 text-xs ml-1">Members</Text>
                                    </View>
                                    <Text className="text-white text-2xl font-bold">{stats.members}</Text>
                                </View>
                            </View>
                            <View className="w-1/2 px-1 mb-2">
                                <View className="bg-white/15 rounded-2xl p-3">
                                    <View className="flex-row items-center mb-1">
                                        <Calendar size={14} color="#FFF" />
                                        <Text className="text-white/70 text-xs ml-1">Events</Text>
                                    </View>
                                    <Text className="text-white text-2xl font-bold">{stats.events}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Pending Applications Alert */}
                {stats.pendingApplications > 0 && (
                    <TouchableOpacity
                        className="mx-5 mt-4 bg-orange-50 border border-orange-200 rounded-2xl p-4 flex-row items-center"
                        onPress={() => router.push('/(leader)/applications')}
                        activeOpacity={0.7}
                    >
                        <View className="w-12 h-12 bg-orange-100 rounded-xl items-center justify-center mr-4">
                            <FileText size={24} color="#F97316" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-orange-800 font-bold text-base">
                                {stats.pendingApplications} Pending
                            </Text>
                            <Text className="text-orange-600 text-sm">Tap to review applications</Text>
                        </View>
                        <ChevronRight size={20} color="#F97316" />
                    </TouchableOpacity>
                )}

                {/* Quick Actions */}
                <View className="px-5 mt-6">
                    <Text className="text-text font-bold text-lg mb-3">Quick Actions</Text>
                    <View className="flex-row">
                        <TouchableOpacity
                            className="flex-1 bg-card border border-border rounded-2xl p-4 mr-2 items-center"
                            onPress={() => router.push('/(leader)/applications')}
                            activeOpacity={0.7}
                        >
                            <View className="w-12 h-12 bg-purple-100 rounded-xl items-center justify-center mb-2">
                                <FileText size={24} color={COLORS.primary} />
                            </View>
                            <Text className="text-text font-bold">Applications</Text>
                            <Text className="text-text-secondary text-xs">Review requests</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-1 bg-card border border-border rounded-2xl p-4 ml-2 items-center"
                            onPress={() => router.push('/(leader)/members')}
                            activeOpacity={0.7}
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
                <View className="px-5 mt-6">
                    <Text className="text-text font-bold text-lg mb-3">Club Info</Text>
                    <View className="bg-card border border-border rounded-2xl overflow-hidden">
                        <View className="flex-row items-center p-4 border-b border-border">
                            <Text className="text-text-secondary flex-1">Description</Text>
                            <Text className="text-text font-medium flex-1 text-right" numberOfLines={2}>
                                {club?.description || 'No description'}
                            </Text>
                        </View>
                        <View className="flex-row items-center p-4 border-b border-border">
                            <Text className="text-text-secondary flex-1">Membership Fee</Text>
                            <Text className="text-text font-medium">
                                {club?.membershipFeeEnabled
                                    ? `${(club.membershipFeeAmount || 0).toLocaleString()}₫`
                                    : 'Free'}
                            </Text>
                        </View>
                        <View className="flex-row items-center p-4">
                            <Text className="text-text-secondary flex-1">Status</Text>
                            <View className="bg-success/10 px-3 py-1 rounded-lg">
                                <Text className="text-success font-bold text-sm">Active</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
