import { useRouter } from 'expo-router';
import { ArrowLeft, Clock, Search } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/theme';
import { useToast } from '../../../contexts/ToastContext';
import { clubService } from '../../../services/club.service';

export default function MyApplicationsScreen() {
    const router = useRouter();
    const { showError } = useToast();
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadApplications();
    }, []);

    const loadApplications = async () => {
        try {
            setLoading(true);
            console.log('Loading applications...');
            const response = await clubService.getMyApplications();
            console.log('Applications response:', response);
            setApplications(response.applications);
        } catch (error) {
            console.log('Error loading applications:', error);
            showError('Error', 'Could not load your applications');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadApplications();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'text-success';
            case 'REJECTED': return 'text-danger';
            case 'PENDING': return 'text-warning';
            default: return 'text-text-secondary';
        }
    };

    const getStatusBg = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'bg-success/10';
            case 'REJECTED': return 'bg-danger/10';
            case 'PENDING': return 'bg-warning/10';
            default: return 'bg-gray-100';
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            className="bg-card rounded-2xl p-4 mb-4 border border-border shadow-sm flex-row items-center"
            onPress={() => router.push({ pathname: '/(student)/clubs/[id]', params: { id: item.club?.slug || item.clubId } })}
        >
            <Image
                source={{ uri: item.club?.logoUrl || 'https://via.placeholder.com/60' }}
                className="w-14 h-14 rounded-xl bg-gray-100"
            />
            <View className="flex-1 ml-4">
                <Text className="text-text font-bold text-base mb-1">{item.club?.name || 'Unknown Club'}</Text>
                <Text className="text-text-secondary text-xs">
                    Applied on: {new Date(item.createdAt).toLocaleDateString()}
                </Text>
            </View>
            <View className={`px-3 py-1.5 rounded-lg ${getStatusBg(item.status)}`}>
                <Text className={`text-xs font-bold capitalize ${getStatusColor(item.status)}`}>
                    {item.status.toLowerCase()}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const filteredApps = applications.filter(app =>
        app.club?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View className="flex-1 bg-background">
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-5 pt-2 pb-4 flex-row items-center">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 items-center justify-center bg-card rounded-xl border border-border mr-4"
                    >
                        <ArrowLeft size={22} color={COLORS.text} />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-text text-2xl font-bold">My Applications</Text>
                        <Text className="text-text-secondary text-sm">Track your club join requests</Text>
                    </View>
                </View>

                {/* Search */}
                <View className="px-5 mb-6">
                    <View className="flex-row items-center bg-card border border-border rounded-xl px-4 h-12">
                        <Search size={20} color={COLORS.textLight} />
                        <TextInput
                            className="flex-1 ml-3 text-text font-medium"
                            placeholder="Search applications..."
                            placeholderTextColor={COLORS.textLight}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                {/* List */}
                <FlatList
                    data={filteredApps}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                    }
                    ListEmptyComponent={!loading ? (
                        <View className="items-center justify-center py-20">
                            <View className="bg-border/30 w-16 h-16 rounded-full items-center justify-center mb-4">
                                <Clock size={32} color={COLORS.textLight} />
                            </View>
                            <Text className="text-text font-bold text-lg">No applications found</Text>
                            <Text className="text-text-secondary text-sm mt-1 text-center px-8">
                                You haven't applied to any clubs yet.
                            </Text>
                        </View>
                    ) : null}
                />
            </SafeAreaView>
        </View>
    );
}
