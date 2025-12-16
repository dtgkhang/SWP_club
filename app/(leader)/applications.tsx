import { useRouter } from 'expo-router';
import { Check, ChevronRight, Clock, Search, User, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { authService } from '../../services/auth.service';
import api from '../../services/api';

interface Application {
    id: string;
    status: string;
    reason?: string;
    appliedAt: string;
    user: {
        id: string;
        fullName?: string;
        email: string;
        studentCode?: string;
    };
}

export default function ApplicationsScreen() {
    const router = useRouter();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processing, setProcessing] = useState<string | null>(null);
    const [clubId, setClubId] = useState<string>('');
    const [filter, setFilter] = useState<'PENDING' | 'ALL'>('PENDING');
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadClubId();
    }, []);

    useEffect(() => {
        if (clubId) {
            loadApplications();
        }
    }, [clubId, filter]);

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

    const loadApplications = async () => {
        try {
            setLoading(true);
            const statusParam = filter === 'PENDING' ? '?status=PENDING' : '';
            const response = await api<{ success: boolean; data: Application[] }>(
                `/clubs/${clubId}/applications${statusParam}`
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
        const actionLabel = action === 'approve' ? 'approve' : 'reject';

        Alert.alert(
            `${action === 'approve' ? 'Approve' : 'Reject'} Application`,
            `Are you sure you want to ${actionLabel} this application?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: action === 'approve' ? 'Approve' : 'Reject',
                    style: action === 'approve' ? 'default' : 'destructive',
                    onPress: async () => {
                        try {
                            setProcessing(applicationId);
                            await api(`/clubs/${clubId}/applications/${applicationId}/review`, {
                                method: 'POST',
                                body: JSON.stringify({ action }), // lowercase 'approve' or 'reject'
                            });
                            // Remove from list or refresh
                            loadApplications();
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to process application');
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

    const renderItem = ({ item }: { item: Application }) => {
        const isPending = item.status === 'PENDING';
        const isProcessing = processing === item.id;

        return (
            <View className="mx-5 mb-3 bg-card border border-border rounded-2xl overflow-hidden">
                {/* User Info */}
                <View className="p-4 flex-row items-center">
                    <View className="w-12 h-12 bg-purple-100 rounded-xl items-center justify-center mr-3">
                        <User size={24} color="#7C3AED" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-text font-bold">{item.user.fullName || 'Unknown'}</Text>
                        <Text className="text-text-secondary text-sm">{item.user.email}</Text>
                        {item.user.studentCode && (
                            <Text className="text-primary text-xs">{item.user.studentCode}</Text>
                        )}
                    </View>
                    <View className={`px-2.5 py-1 rounded-lg ${item.status === 'PENDING' ? 'bg-warning-soft' :
                        item.status === 'APPROVED' ? 'bg-success-soft' : 'bg-danger-soft'
                        }`}>
                        <Text className={`text-xs font-bold ${item.status === 'PENDING' ? 'text-warning' :
                            item.status === 'APPROVED' ? 'text-success' : 'text-danger'
                            }`}>
                            {item.status}
                        </Text>
                    </View>
                </View>

                {/* Application Reason */}
                {item.reason && (
                    <View className="px-4 pb-3">
                        <Text className="text-text-secondary text-sm italic">"{item.reason}"</Text>
                    </View>
                )}

                {/* Applied Date */}
                <View className="px-4 pb-3 flex-row items-center">
                    <Clock size={12} color={COLORS.textSecondary} />
                    <Text className="text-text-secondary text-xs ml-1">
                        Applied {new Date(item.appliedAt).toLocaleDateString('vi-VN')}
                    </Text>
                </View>

                {/* Action Buttons for Pending */}
                {isPending && (
                    <View className="flex-row border-t border-border">
                        <TouchableOpacity
                            className="flex-1 py-3 flex-row items-center justify-center border-r border-border"
                            onPress={() => handleReview(item.id, 'reject')}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <ActivityIndicator size="small" color={COLORS.error} />
                            ) : (
                                <>
                                    <X size={18} color={COLORS.error} />
                                    <Text className="text-danger font-bold ml-2">Reject</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="flex-1 py-3 flex-row items-center justify-center bg-success"
                            onPress={() => handleReview(item.id, 'approve')}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
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

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            {/* Header */}
            <View className="px-5 pt-4 pb-4">
                <Text className="text-text text-2xl font-bold">Applications</Text>
                <Text className="text-text-secondary text-sm">Review membership requests</Text>
            </View>

            {/* Search */}
            <View className="px-5 mb-4">
                <View className="flex-row items-center bg-card border border-border rounded-2xl px-4 h-12">
                    <Search size={20} color={COLORS.textSecondary} />
                    <TextInput
                        placeholder="Search by name, email..."
                        className="flex-1 ml-3 text-text"
                        placeholderTextColor="#94A3B8"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            {/* Filter Tabs */}
            <View className="flex-row px-5 mb-4">
                <TouchableOpacity
                    onPress={() => setFilter('PENDING')}
                    className={`px-4 py-2 rounded-xl mr-2 ${filter === 'PENDING' ? 'bg-purple-600' : 'bg-card border border-border'}`}
                    style={filter === 'PENDING' ? { backgroundColor: '#7C3AED' } : {}}
                >
                    <Text className={`font-bold ${filter === 'PENDING' ? 'text-white' : 'text-text-secondary'}`}>
                        Pending
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setFilter('ALL')}
                    className={`px-4 py-2 rounded-xl ${filter === 'ALL' ? 'bg-purple-600' : 'bg-card border border-border'}`}
                    style={filter === 'ALL' ? { backgroundColor: '#7C3AED' } : {}}
                >
                    <Text className={`font-bold ${filter === 'ALL' ? 'text-white' : 'text-text-secondary'}`}>
                        All
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Applications List */}
            <FlatList
                data={filteredApplications}
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
                            <Check size={40} color="#7C3AED" />
                        </View>
                        <Text className="text-text font-bold text-lg">
                            {filter === 'PENDING' ? 'No pending applications' : 'No applications'}
                        </Text>
                        <Text className="text-text-secondary text-sm mt-1">
                            {filter === 'PENDING' ? 'All caught up!' : 'No one has applied yet'}
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
