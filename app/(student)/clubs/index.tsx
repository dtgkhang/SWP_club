import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ChevronRight, Clock, Crown, Search, Sparkles, Star, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/theme';
import { useToast } from '../../../contexts/ToastContext';
import { authService } from '../../../services/auth.service';
import { Club, clubService } from '../../../services/club.service';

export default function ClubList() {
    const router = useRouter();
    const { showError } = useToast();
    const [activeTab, setActiveTab] = useState<'EXPLORE' | 'MY_CLUBS'>('EXPLORE');
    const [allClubs, setAllClubs] = useState<Club[]>([]);
    const [myClubIds, setMyClubIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        loadClubs();
    }, [debouncedSearch]);

    const loadData = async () => {
        await Promise.all([loadClubs(), loadMyClubs()]);
    };

    const loadMyClubs = async () => {
        try {
            const { user } = await authService.getProfile();
            const clubIds = (user?.memberships || [])
                .filter((m: any) => m.status === 'ACTIVE')
                .map((m: any) => m.clubId);
            setMyClubIds(clubIds);
        } catch (error) {
            console.log('Error loading my clubs:', error);
        }
    };

    const loadClubs = async () => {
        try {
            setLoading(true);
            const result = await clubService.getAllClubs(1, 50, debouncedSearch || undefined);
            setAllClubs(result.clubs || []);
        } catch (error: any) {
            showError('Loading Failed', 'Could not load clubs');
        } finally {
            setLoading(false);
        }
    };

    // Filter clubs based on active tab
    const exploreClubs = allClubs.filter(c => !myClubIds.includes(c.id));
    const myClubs = allClubs.filter(c => myClubIds.includes(c.id));
    const displayedClubs = activeTab === 'EXPLORE' ? exploreClubs : myClubs;

    // Premium Club Card
    const renderClubCard = ({ item: club, index }: { item: Club; index: number }) => {
        const isMember = myClubIds.includes(club.id);
        const memberCount = club._count?.memberships || 0;
        const eventCount = club._count?.events || 0;

        return (
            <TouchableOpacity
                className="mx-5 mb-4 bg-card rounded-3xl overflow-hidden border border-border shadow-sm"
                onPress={() => router.push({
                    pathname: '/(student)/clubs/[id]' as any,
                    params: { id: club.slug || club.id, isMember: isMember ? 'true' : 'false' }
                })}
                activeOpacity={0.8}
            >
                {/* Club Image with Gradient */}
                <View className="relative">
                    <Image
                        source={{ uri: club.logoUrl || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400' }}
                        style={{ width: '100%', height: 140 }}
                        contentFit="cover"
                        transition={300}
                    />
                    <View className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    {/* Badge */}
                    {isMember && (
                        <View className="absolute top-3 right-3 bg-success px-3 py-1 rounded-full flex-row items-center">
                            <Star size={12} color="#FFF" fill="#FFF" />
                            <Text className="text-white text-xs font-bold ml-1">Member</Text>
                        </View>
                    )}

                    {/* Featured Badge for first club */}
                    {index === 0 && activeTab === 'EXPLORE' && (
                        <View className="absolute top-3 left-3 bg-primary px-3 py-1 rounded-full flex-row items-center">
                            <Crown size={12} color="#FFF" />
                            <Text className="text-white text-xs font-bold ml-1">Featured</Text>
                        </View>
                    )}

                    {/* Club Name on Image */}
                    <View className="absolute bottom-0 left-0 right-0 p-4">
                        <Text className="text-white text-lg font-bold" numberOfLines={1}>
                            {club.name}
                        </Text>
                    </View>
                </View>

                {/* Club Info */}
                <View className="p-4">
                    <Text className="text-text-secondary text-sm mb-3" numberOfLines={2}>
                        {club.description || 'A great club to join and explore new opportunities with fellow students.'}
                    </Text>

                    {/* Stats Row */}
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                            <View className="flex-row items-center bg-secondary-soft px-2.5 py-1.5 rounded-lg mr-2">
                                <Users size={14} color={COLORS.secondary} />
                                <Text className="text-secondary text-xs font-bold ml-1.5">{memberCount}</Text>
                            </View>
                            <View className="flex-row items-center bg-primary-soft px-2.5 py-1.5 rounded-lg">
                                <Sparkles size={14} color={COLORS.primary} />
                                <Text className="text-primary text-xs font-bold ml-1.5">{eventCount}</Text>
                            </View>
                        </View>

                        <View className="flex-row items-center">
                            <Text className="text-primary text-sm font-medium mr-1">
                                {isMember ? 'View' : 'Join'}
                            </Text>
                            <View className="w-6 h-6 bg-primary-soft rounded-full items-center justify-center">
                                <ChevronRight size={14} color={COLORS.primary} />
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const ListHeader = () => (
        <View className="mb-2">
            {/* Header */}
            <View className="flex-row justify-between items-center px-5 pt-4 pb-5">
                <View>
                    <Text className="text-text text-2xl font-bold">Clubs</Text>
                    <Text className="text-text-secondary text-sm mt-0.5">Discover amazing student clubs</Text>
                </View>
                <TouchableOpacity
                    className="w-11 h-11 bg-card rounded-xl items-center justify-center border border-border"
                    onPress={() => router.push('/(student)/clubs/my-applications')}
                >
                    <Clock size={20} color={COLORS.text} />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View className="px-5 mb-5">
                <View className="flex-row items-center bg-card border border-border rounded-2xl px-4 h-14 shadow-sm">
                    <Search size={20} color={COLORS.textSecondary} />
                    <TextInput
                        placeholder="Search clubs..."
                        className="flex-1 ml-3 text-text text-base"
                        placeholderTextColor="#94A3B8"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            {/* Premium Tabs */}
            <View className="mx-5 mb-5 p-1.5 bg-card border border-border rounded-2xl flex-row shadow-sm">
                <TouchableOpacity
                    onPress={() => setActiveTab('EXPLORE')}
                    className={`flex-1 py-3.5 items-center rounded-xl flex-row justify-center ${activeTab === 'EXPLORE' ? 'bg-primary shadow-md' : ''}`}
                >
                    <Search size={16} color={activeTab === 'EXPLORE' ? '#FFF' : COLORS.textSecondary} />
                    <Text className={`font-bold ml-2 ${activeTab === 'EXPLORE' ? 'text-white' : 'text-text-secondary'}`}>
                        Explore ({exploreClubs.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setActiveTab('MY_CLUBS')}
                    className={`flex-1 py-3.5 items-center rounded-xl flex-row justify-center ${activeTab === 'MY_CLUBS' ? 'bg-primary shadow-md' : ''}`}
                >
                    <Star size={16} color={activeTab === 'MY_CLUBS' ? '#FFF' : COLORS.textSecondary} />
                    <Text className={`font-bold ml-2 ${activeTab === 'MY_CLUBS' ? 'text-white' : 'text-text-secondary'}`}>
                        My Clubs ({myClubs.length})
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const EmptyList = () => (
        <View className="items-center justify-center py-16 px-8">
            <View className="w-20 h-20 bg-border/30 rounded-full items-center justify-center mb-4">
                <Text className="text-4xl">
                    {activeTab === 'EXPLORE' ? '🎉' : '🔍'}
                </Text>
            </View>
            <Text className="text-text font-bold text-lg text-center">
                {activeTab === 'EXPLORE' ? "You've joined all clubs!" : 'No clubs joined yet'}
            </Text>
            <Text className="text-text-secondary text-sm mt-2 text-center">
                {activeTab === 'EXPLORE'
                    ? 'Amazing! You are part of every club on campus.'
                    : 'Explore clubs and join to see them here'}
            </Text>
            {activeTab === 'MY_CLUBS' && (
                <TouchableOpacity
                    className="mt-6 bg-primary px-8 py-4 rounded-xl shadow-md"
                    onPress={() => setActiveTab('EXPLORE')}
                >
                    <Text className="text-white font-bold">Explore Clubs</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <FlatList
                    data={displayedClubs}
                    renderItem={renderClubCard}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    ListHeaderComponent={ListHeader}
                    ListEmptyComponent={!loading ? EmptyList : null}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={6}
                    windowSize={5}
                    ListFooterComponent={loading ? (
                        <View className="py-10">
                            <ActivityIndicator size="large" color={COLORS.primary} />
                        </View>
                    ) : null}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
