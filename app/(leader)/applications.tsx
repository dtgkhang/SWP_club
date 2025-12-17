import { useFocusEffect, useRouter } from 'expo-router';
import { Check, Clock, Search, User, X } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { authService } from '../../services/auth.service';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';

interface Application {
    id: string;
    status: string;
    introduction?: string;
    createdAt: string;
    user: {
        id: string;
        fullName?: string;
        email: string;
        studentCode?: string;
    };
}

export default function ApplicationsScreen() {
    const router = useRouter();
    const { showSuccess, showError } = useToast();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processing, setProcessing] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);
    const [clubId, setClubId] = useState<string>('');
    const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
    const [search, setSearch] = useState('');

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
                loadApplications(leaderMembership.clubId);
            }
        } catch (error) {
            console.log('Error loading club ID:', error);
            setLoading(false);
        }
    };

    const loadApplications = async (cId?: string) => {
        try {
            setLoading(true);
            const targetClubId = cId || clubId;
            if (!targetClubId) return;

            const statusParam = filter !== 'ALL' ? `?status=${filter}` : '';
            const response = await api<{ success: boolean; data: Application[] }>(
                `/clubs/${targetClubId}/applications${statusParam}`
            );
            setApplications(response.data || []);
        } catch (error) {
            console.log('Error loading applications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadApplications();
    };

    const handleReview = async (applicationId: string, action: 'approve' | 'reject') => {
        const actionLabel = action === 'approve' ? 'Approve' : 'Reject';

        Alert.alert(
            `${actionLabel} Application`,
            `Are you sure you want to ${action} this application?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: actionLabel,
                    style: action === 'approve' ? 'default' : 'destructive',
                    onPress: async () => {
                        try {
                            setProcessing({ id: applicationId, action });
                            await api(`/clubs/${clubId}/applications/${applicationId}/review`, {
                                method: 'POST',
                                body: JSON.stringify({ action }),
                            });
                            showSuccess('Success', `Application ${action}d successfully!`);
                            loadApplications();
                        } catch (error: any) {
                            showError('Error', error.message || 'Failed to process application');
                        } finally {
                            setProcessing(null);
                        }
                    },
                },
            ]
        );
    };

    const filteredApplications = applications.filter(app => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            app.user.fullName?.toLowerCase().includes(searchLower) ||
            app.user.email.toLowerCase().includes(searchLower) ||
            app.user.studentCode?.toLowerCase().includes(searchLower)
        );
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return { bg: 'bg-warning/10', text: 'text-warning' };
            case 'APPROVED': return { bg: 'bg-success/10', text: 'text-success' };
            case 'REJECTED': return { bg: 'bg-danger/10', text: 'text-danger' };
            default: return { bg: 'bg-gray-100', text: 'text-gray-500' };
        }
    };

    const renderItem = ({ item }: { item: Application }) => {
        const isPending = item.status === 'PENDING';
        const isProcessingReject = processing?.id === item.id && processing?.action === 'reject';
        const isProcessingApprove = processing?.id === item.id && processing?.action === 'approve';
        const isProcessing = processing?.id === item.id;
        const statusColors = getStatusColor(item.status);

        return (
            <View
                className="mx-5 mb-3 bg-card rounded-2xl overflow-hidden"
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                }}
            >
                {/* User Info */}
                <View className="p-4 flex-row items-center">
                    <View className="w-12 h-12 bg-primary/10 rounded-xl items-center justify-center mr-3">
                        <Text className="text-primary text-lg font-bold">
                            {(item.user.fullName || item.user.email || '?').charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View className="flex-1">
                        <Text className="text-text font-bold text-base">{item.user.fullName || 'Unknown'}</Text>
                        <Text className="text-text-secondary text-sm">{item.user.email}</Text>
                        {item.user.studentCode && (
                            <Text className="text-primary text-xs font-medium mt-0.5">{item.user.studentCode}</Text>
                        )}
                    </View>
                    <View className={`px-2.5 py-1 rounded-lg ${statusColors.bg}`}>
                        <Text className={`text-xs font-bold ${statusColors.text}`}>
                            {item.status}
                        </Text>
                    </View>
                </View>

                {/* Introduction */}
                {item.introduction && (
                    <View className="px-4 pb-3">
                        <View className="bg-gray-50 rounded-xl p-3">
                            <Text className="text-text-secondary text-sm italic">"{item.introduction}"</Text>
                        </View>
                    </View>
                )}

                {/* Applied Date */}
                <View className="px-4 pb-3 flex-row items-center">
                    <Clock size={12} color={COLORS.textSecondary} />
                    <Text className="text-text-secondary text-xs ml-1">
                        Applied {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </Text>
                </View>

                {/* Action Buttons for Pending */}
                {isPending && (
                    <View className="flex-row border-t border-border">
                        <TouchableOpacity
                            className="flex-1 py-3.5 flex-row items-center justify-center border-r border-border"
                            onPress={() => handleReview(item.id, 'reject')}
                            disabled={isProcessing}
                            activeOpacity={0.7}
                        >
                            {isProcessingReject ? (
                                <ActivityIndicator size="small" color={COLORS.error} />
                            ) : (
                                <>
                                    <X size={18} color={COLORS.error} />
                                    <Text className="text-danger font-bold ml-2">Reject</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="flex-1 py-3.5 flex-row items-center justify-center"
                            style={{ backgroundColor: COLORS.success }}
                            onPress={() => handleReview(item.id, 'approve')}
                            disabled={isProcessing}
                            activeOpacity={0.7}
                        >
                            {isProcessingApprove ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <>
                                    <Check size={18} color="#FFF" />
                                    <Text className="text-white font-bold ml-2">Approve</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    const FilterTab = ({ value, label }: { value: typeof filter; label: string }) => (
        <TouchableOpacity
            onPress={() => {
                setFilter(value);
                if (clubId) loadApplications();
            }}
            className={`px-4 py-2 rounded-full mr-2 ${filter === value ? '' : 'bg-card border border-border'}`}
            style={filter === value ? { backgroundColor: COLORS.primary } : {}}
            activeOpacity={0.7}
        >
            <Text className={`font-semibold ${filter === value ? 'text-white' : 'text-text-secondary'}`}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            {/* Header */}
            <View className="px-5 pt-4 pb-2">
                <Text className="text-text text-2xl font-bold">Applications</Text>
                <Text className="text-text-secondary text-sm">Review membership requests</Text>
            </View>

            {/* Search */}
            <View className="px-5 py-3">
                <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 h-12">
                    <Search size={20} color={COLORS.textSecondary} />
                    <TextInput
                        placeholder="Search by name, email..."
                        className="flex-1 ml-3 text-text"
                        placeholderTextColor={COLORS.textSecondary}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            {/* Filter Tabs */}
            <View className="px-5 pb-3">
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={[
                        { value: 'PENDING' as const, label: 'Pending' },
                        { value: 'APPROVED' as const, label: 'Approved' },
                        { value: 'REJECTED' as const, label: 'Rejected' },
                        { value: 'ALL' as const, label: 'All' },
                    ]}
                    keyExtractor={item => item.value}
                    renderItem={({ item }) => <FilterTab value={item.value} label={item.label} />}
                />
            </View>

            {/* Applications List */}
            <FlatList
                data={filteredApplications}
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
                            <User size={40} color={COLORS.primary} />
                        </View>
                        <Text className="text-text font-bold text-lg">
                            {filter === 'PENDING' ? 'No pending applications' : `No ${filter.toLowerCase()} applications`}
                        </Text>
                        <Text className="text-text-secondary text-sm mt-1 text-center px-10">
                            {filter === 'PENDING' ? 'All caught up! Check back later.' : 'No applications match this filter.'}
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
