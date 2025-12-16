import { useRouter } from 'expo-router';
import { Crown, Search, Shield, User, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { authService } from '../../services/auth.service';
import api from '../../services/api';

interface Member {
    id: string;
    role: string;
    status: string;
    joinedAt: string;
    user: {
        id: string;
        fullName?: string;
        email: string;
        studentCode?: string;
        phone?: string;
    };
}

const ROLE_COLORS: Record<string, { bg: string; text: string; icon: any }> = {
    LEADER: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Crown },
    STAFF: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Shield },
    TREASURER: { bg: 'bg-green-100', text: 'text-green-700', icon: Shield },
    MEMBER: { bg: 'bg-gray-100', text: 'text-gray-700', icon: User },
};

export default function MembersScreen() {
    const router = useRouter();
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [clubId, setClubId] = useState<string>('');
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('ALL');

    useEffect(() => {
        loadClubId();
    }, []);

    useEffect(() => {
        if (clubId) {
            loadMembers();
        }
    }, [clubId]);

    const loadClubId = async () => {
        try {
            const { user } = await authService.getProfile();
            const leaderMembership = user?.memberships?.find(
                (m: any) => m.role === 'LEADER' && m.status === 'ACTIVE'
            );
            if (leaderMembership?.clubId) {
                setClubId(leaderMembership.clubId);
            }
        } catch (error) {
            console.log('Error loading club ID:', error);
        }
    };

    const loadMembers = async () => {
        try {
            setLoading(true);
            const response = await api<any>(`/clubs/${clubId}/members`);
            // API returns { success: true, data: [...] } or { success: true, data: [...], pagination: {...} }
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
        // Role filter
        if (roleFilter !== 'ALL' && member.role !== roleFilter) return false;

        // Search filter
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            member.user.fullName?.toLowerCase().includes(searchLower) ||
            member.user.email.toLowerCase().includes(searchLower) ||
            member.user.studentCode?.toLowerCase().includes(searchLower)
        );
    });

    // Sort: Leader first, then Staff/Treasurer, then Members
    const sortedMembers = filteredMembers.sort((a, b) => {
        const roleOrder = { LEADER: 0, STAFF: 1, TREASURER: 1, MEMBER: 2 };
        return (roleOrder[a.role as keyof typeof roleOrder] || 2) - (roleOrder[b.role as keyof typeof roleOrder] || 2);
    });

    const roleCounts = {
        ALL: members.length,
        LEADER: members.filter(m => m.role === 'LEADER').length,
        STAFF: members.filter(m => ['STAFF', 'TREASURER'].includes(m.role)).length,
        MEMBER: members.filter(m => m.role === 'MEMBER').length,
    };

    const renderItem = ({ item }: { item: Member }) => {
        const roleConfig = ROLE_COLORS[item.role] || ROLE_COLORS.MEMBER;
        const RoleIcon = roleConfig.icon;

        return (
            <View className="mx-5 mb-3 bg-card border border-border rounded-2xl p-4">
                <View className="flex-row items-center">
                    <View className={`w-12 h-12 ${roleConfig.bg} rounded-xl items-center justify-center mr-3`}>
                        <RoleIcon size={24} color={COLORS.text} />
                    </View>
                    <View className="flex-1">
                        <Text className="text-text font-bold">{item.user.fullName || 'Unknown'}</Text>
                        <Text className="text-text-secondary text-sm">{item.user.email}</Text>
                        <View className="flex-row items-center mt-1">
                            {item.user.studentCode && (
                                <Text className="text-primary text-xs mr-2">{item.user.studentCode}</Text>
                            )}
                            <Text className="text-text-secondary text-xs">
                                Joined {new Date(item.joinedAt).toLocaleDateString('vi-VN')}
                            </Text>
                        </View>
                    </View>
                    <View className={`px-2.5 py-1 rounded-lg ${roleConfig.bg}`}>
                        <Text className={`text-xs font-bold ${roleConfig.text}`}>{item.role}</Text>
                    </View>
                </View>
            </View>
        );
    };

    const RoleChip = ({ label, value, count }: { label: string; value: string; count: number }) => (
        <TouchableOpacity
            onPress={() => setRoleFilter(value)}
            className={`px-4 py-2 rounded-xl mr-2 ${roleFilter === value ? 'bg-purple-600' : 'bg-card border border-border'}`}
            style={roleFilter === value ? { backgroundColor: '#7C3AED' } : {}}
        >
            <Text className={`font-bold ${roleFilter === value ? 'text-white' : 'text-text-secondary'}`}>
                {label} ({count})
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            {/* Header */}
            <View className="px-5 pt-4 pb-4">
                <Text className="text-text text-2xl font-bold">Members</Text>
                <Text className="text-text-secondary text-sm">Manage your club members</Text>
            </View>

            {/* Search */}
            <View className="px-5 mb-4">
                <View className="flex-row items-center bg-card border border-border rounded-2xl px-4 h-12">
                    <Search size={20} color={COLORS.textSecondary} />
                    <TextInput
                        placeholder="Search members..."
                        className="flex-1 ml-3 text-text"
                        placeholderTextColor="#94A3B8"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            {/* Role Filter */}
            <View className="mb-4">
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 20 }}
                    data={[
                        { label: 'All', value: 'ALL', count: roleCounts.ALL },
                        { label: 'Leader', value: 'LEADER', count: roleCounts.LEADER },
                        { label: 'Staff', value: 'STAFF', count: roleCounts.STAFF },
                        { label: 'Member', value: 'MEMBER', count: roleCounts.MEMBER },
                    ]}
                    keyExtractor={item => item.value}
                    renderItem={({ item }) => (
                        <RoleChip label={item.label} value={item.value} count={item.count} />
                    )}
                />
            </View>

            {/* Members List */}
            <FlatList
                data={sortedMembers}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />
                }
                ListEmptyComponent={!loading ? (
                    <View className="items-center justify-center py-20">
                        <View className="w-20 h-20 bg-purple-100 rounded-full items-center justify-center mb-4">
                            <Users size={40} color="#7C3AED" />
                        </View>
                        <Text className="text-text font-bold text-lg">No members found</Text>
                        <Text className="text-text-secondary text-sm mt-1">
                            {search ? 'Try a different search' : 'Your club has no members yet'}
                        </Text>
                    </View>
                ) : null}
                ListFooterComponent={loading ? (
                    <View className="py-10">
                        <ActivityIndicator size="large" color="#7C3AED" />
                    </View>
                ) : null}
            />
        </SafeAreaView>
    );
}
