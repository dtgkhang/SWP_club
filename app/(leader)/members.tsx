import { useFocusEffect } from 'expo-router';
import { Crown, Search, Shield, Sparkles, User, Users, Wallet } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { authService } from '../../services/auth.service';
import api from '../../services/api';

interface Member {
    id: string;
    role: string;
    status: string;
    joinedAt?: string;
    createdAt?: string;
    user: {
        id: string;
        fullName?: string;
        email: string;
        studentCode?: string;
        phone?: string;
    };
}

const ROLE_CONFIG: Record<string, { bg: string; text: string; icon: any; color: string }> = {
    LEADER: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Crown, color: '#7C3AED' },
    ADMIN: { bg: 'bg-orange-100', text: 'text-orange-700', icon: Shield, color: '#EA580C' },
    TREASURER: { bg: 'bg-green-100', text: 'text-green-700', icon: Wallet, color: '#16A34A' },
    STAFF: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Sparkles, color: '#2563EB' },
    MEMBER: { bg: 'bg-gray-100', text: 'text-gray-600', icon: User, color: '#6B7280' },
};

export default function MembersScreen() {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [clubId, setClubId] = useState<string>('');
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('ALL');

    useFocusEffect(
        useCallback(() => {
            loadClubId();
        }, [])
    );

    const loadClubId = async () => {
        try {
            const { user } = await authService.getProfile();
            const leaderMembership = user?.memberships?.find(
                (m: any) => m.role === 'LEADER' && m.status === 'ACTIVE'
            );
            if (leaderMembership?.clubId) {
                setClubId(leaderMembership.clubId);
                loadMembers(leaderMembership.clubId);
            }
        } catch (error) {
            console.log('Error loading club ID:', error);
            setLoading(false);
        }
    };

    const loadMembers = async (cId?: string) => {
        try {
            setLoading(true);
            const targetClubId = cId || clubId;
            if (!targetClubId) return;

            const response = await api<any>(`/clubs/${targetClubId}/members?limit=100`);
            const membersData = response.data || [];
            setMembers(Array.isArray(membersData) ? membersData : []);
        } catch (error) {
            console.log('Error loading members:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadMembers();
    };

    const filteredMembers = members.filter(member => {
        if (roleFilter !== 'ALL') {
            if (roleFilter === 'STAFF' && !['STAFF', 'TREASURER', 'ADMIN'].includes(member.role)) return false;
            else if (roleFilter !== 'STAFF' && member.role !== roleFilter) return false;
        }

        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            member.user.fullName?.toLowerCase().includes(searchLower) ||
            member.user.email.toLowerCase().includes(searchLower) ||
            member.user.studentCode?.toLowerCase().includes(searchLower)
        );
    });

    const sortedMembers = [...filteredMembers].sort((a, b) => {
        const roleOrder: Record<string, number> = { LEADER: 0, ADMIN: 1, TREASURER: 2, STAFF: 3, MEMBER: 4 };
        return (roleOrder[a.role] ?? 5) - (roleOrder[b.role] ?? 5);
    });

    const roleCounts = {
        ALL: members.length,
        LEADER: members.filter(m => m.role === 'LEADER').length,
        STAFF: members.filter(m => ['STAFF', 'TREASURER', 'ADMIN'].includes(m.role)).length,
        MEMBER: members.filter(m => m.role === 'MEMBER').length,
    };

    const renderItem = ({ item }: { item: Member }) => {
        const config = ROLE_CONFIG[item.role] || ROLE_CONFIG.MEMBER;
        const RoleIcon = config.icon;
        const joinDate = item.joinedAt || item.createdAt;

        return (
            <View
                className="mx-5 mb-3 bg-card rounded-2xl p-4"
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                }}
            >
                <View className="flex-row items-center">
                    <View className={`w-12 h-12 ${config.bg} rounded-xl items-center justify-center mr-3`}>
                        <RoleIcon size={22} color={config.color} />
                    </View>
                    <View className="flex-1">
                        <Text className="text-text font-bold text-base">{item.user.fullName || 'Unknown'}</Text>
                        <Text className="text-text-secondary text-sm">{item.user.email}</Text>
                        {(item.user.studentCode || joinDate) && (
                            <View className="flex-row items-center mt-1">
                                {item.user.studentCode && (
                                    <Text className="text-primary text-xs font-medium mr-2">{item.user.studentCode}</Text>
                                )}
                                {joinDate && (
                                    <Text className="text-text-secondary text-xs">
                                        Joined {new Date(joinDate).toLocaleDateString('vi-VN')}
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>
                    <View className={`px-2.5 py-1.5 rounded-lg ${config.bg}`}>
                        <Text className={`text-xs font-bold ${config.text}`}>{item.role}</Text>
                    </View>
                </View>
            </View>
        );
    };

    const FilterTab = ({ label, value, count }: { label: string; value: string; count: number }) => (
        <TouchableOpacity
            onPress={() => setRoleFilter(value)}
            className={`px-4 py-2 rounded-full mr-2 ${roleFilter === value ? '' : 'bg-card border border-border'}`}
            style={roleFilter === value ? { backgroundColor: COLORS.primary } : {}}
            activeOpacity={0.7}
        >
            <Text className={`font-semibold ${roleFilter === value ? 'text-white' : 'text-text-secondary'}`}>
                {label} ({count})
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            {/* Header */}
            <View className="px-5 pt-4 pb-2">
                <Text className="text-text text-2xl font-bold">Members</Text>
                <Text className="text-text-secondary text-sm">Manage your club team</Text>
            </View>

            {/* Search */}
            <View className="px-5 py-3">
                <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 h-12">
                    <Search size={20} color={COLORS.textSecondary} />
                    <TextInput
                        placeholder="Search members..."
                        className="flex-1 ml-3 text-text"
                        placeholderTextColor={COLORS.textSecondary}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            {/* Role Filter */}
            <View className="px-5 pb-3">
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={[
                        { label: 'All', value: 'ALL', count: roleCounts.ALL },
                        { label: 'Leader', value: 'LEADER', count: roleCounts.LEADER },
                        { label: 'Staff', value: 'STAFF', count: roleCounts.STAFF },
                        { label: 'Member', value: 'MEMBER', count: roleCounts.MEMBER },
                    ]}
                    keyExtractor={item => item.value}
                    renderItem={({ item }) => <FilterTab label={item.label} value={item.value} count={item.count} />}
                />
            </View>

            {/* Members List */}
            <FlatList
                data={sortedMembers}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
                ListEmptyComponent={!loading ? (
                    <View className="items-center justify-center py-20">
                        <View className="w-20 h-20 bg-purple-100 rounded-full items-center justify-center mb-4">
                            <Users size={40} color={COLORS.primary} />
                        </View>
                        <Text className="text-text font-bold text-lg">No members found</Text>
                        <Text className="text-text-secondary text-sm mt-1 text-center px-10">
                            {search ? 'Try a different search term' : 'Your club has no members yet'}
                        </Text>
                    </View>
                ) : null}
                ListFooterComponent={loading ? (
                    <View className="py-10">
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : null}
            />
        </SafeAreaView>
    );
}
