import { Image } from 'expo-image';
import { Link, useFocusEffect } from 'expo-router';
import { ChevronRight, Clock, Crown, Heart, Search, Sparkles, Star, TrendingUp, Users } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, DimensionValue, Dimensions, FlatList, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/theme';
import { useToast } from '../../../contexts/ToastContext';
import { authService } from '../../../services/auth.service';
import { Club, clubService } from '../../../services/club.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Skeleton Component
const Skeleton = ({ width, height, rounded = 8 }: { width: DimensionValue; height: number; rounded?: number }) => (
    <View className="bg-gray-200 animate-pulse" style={{ width, height, borderRadius: rounded }} />
);

// Club Card Skeleton
const ClubCardSkeleton = () => (
    <View className="mb-4">
        <View className="bg-card rounded-3xl overflow-hidden">
            <View className="flex-row p-4">
                <Skeleton width={90} height={90} rounded={20} />
                <View className="flex-1 ml-4 justify-between">
                    <Skeleton width="80%" height={20} rounded={6} />
                    <Skeleton width="60%" height={14} rounded={4} />
                    <View className="flex-row mt-2">
                        <Skeleton width={60} height={24} rounded={12} />
                        <View className="ml-2">
                            <Skeleton width={60} height={24} rounded={12} />
                        </View>
                    </View>
                </View>
            </View>
        </View>
    </View>
);

export default function ClubList() {
    const { showError } = useToast();
    const [activeTab, setActiveTab] = useState<'EXPLORE' | 'MY_CLUBS'>('EXPLORE');
    const [allClubs, setAllClubs] = useState<Club[]>([]);
    const [myClubIds, setMyClubIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        try {
            if (!refreshing) setLoading(true);
            const [clubsResult, profile] = await Promise.all([
                clubService.getAllClubs(1, 100),
                authService.getProfile().catch(() => ({ user: null }))
            ]);

            setAllClubs(clubsResult.clubs || []);

            const clubIds = (profile.user?.memberships || [])
                .filter((m: any) => m.status === 'ACTIVE')
                .map((m: any) => m.clubId);
            setMyClubIds(clubIds);
        } catch (error: any) {
            showError('Loading Failed', 'Could not load clubs');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const query = search.toLowerCase().trim();
    const filterClubs = (clubs: Club[]) => {
        if (!query) return clubs;
        return clubs.filter(c =>
            c.name?.toLowerCase().includes(query) ||
            c.description?.toLowerCase().includes(query)
        );
    };

    const exploreClubs = filterClubs(allClubs.filter(c => !myClubIds.includes(c.id)));
    const myClubs = filterClubs(allClubs.filter(c => myClubIds.includes(c.id)));
    const displayedClubs = activeTab === 'EXPLORE' ? exploreClubs : myClubs;
    const featuredClub = activeTab === 'EXPLORE' && exploreClubs.length > 0 && !query ? exploreClubs[0] : null;

    // Featured Club Card - Premium Design
    const FeaturedClubCard = ({ club }: { club: Club }) => (
        <Link
            href={{
                pathname: '/(student)/clubs/[id]',
                params: { id: club.slug || club.id }
            }}
            asChild
        >
            <TouchableOpacity
                className="mb-6"
                activeOpacity={0.95}
                style={{
                    shadowColor: '#7C3AED',
                    shadowOffset: { width: 0, height: 12 },
                    shadowOpacity: 0.35,
                    shadowRadius: 24,
                    elevation: 15,
                }}
            >
                <View className="rounded-[28px] overflow-hidden" style={{ height: 220 }}>
                    <Image
                        source={{ uri: club.logoUrl || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800' }}
                        style={{ width: '100%', height: '100%', position: 'absolute' }}
                        contentFit="cover"
                        transition={400}
                    />
                    {/* Gradient Overlay */}
                    <View
                        className="absolute inset-0"
                        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                    />

                    {/* Featured Badge */}
                    <View className="absolute top-4 left-4">
                        <View
                            className="flex-row items-center px-3 py-1.5 rounded-full"
                            style={{ backgroundColor: 'rgba(255, 215, 0, 0.2)', borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.5)' }}
                        >
                            <Crown size={12} color="#FFD700" fill="#FFD700" />
                            <Text className="text-yellow-400 text-[10px] font-bold ml-1.5 tracking-wider">FEATURED</Text>
                        </View>
                    </View>

                    {/* Stats Pills */}
                    <View className="absolute top-4 right-4 flex-row">
                        <View className="bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded-full flex-row items-center mr-2">
                            <Users size={11} color="#FFF" />
                            <Text className="text-white text-[11px] font-bold ml-1">{club._count?.memberships || 0}</Text>
                        </View>
                        <View className="bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded-full flex-row items-center">
                            <Sparkles size={11} color="#FFF" />
                            <Text className="text-white text-[11px] font-bold ml-1">{club._count?.events || 0}</Text>
                        </View>
                    </View>

                    {/* Content */}
                    <View className="absolute bottom-0 left-0 right-0 p-5">
                        <Text className="text-white text-2xl font-extrabold mb-1.5" numberOfLines={1}>
                            {club.name}
                        </Text>
                        <Text className="text-white/75 text-sm mb-4 leading-5" numberOfLines={2}>
                            {club.description || 'A great community to join, learn, and grow together.'}
                        </Text>
                        <View className="flex-row items-center">
                            <View
                                className="px-5 py-2.5 rounded-full flex-row items-center"
                                style={{ backgroundColor: COLORS.primary }}
                            >
                                <Text className="text-white font-bold text-sm">Explore</Text>
                                <ChevronRight size={16} color="#FFF" className="ml-1" />
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Link>
    );

    // Regular Club Card - Vertical Premium Design
    const renderClubCard = ({ item: club, index }: { item: Club; index: number }) => {
        const isMember = myClubIds.includes(club.id);
        const memberCount = club._count?.memberships || 0;
        const eventCount = club._count?.events || 0;

        // Skip first item in Explore (it's featured)
        if (activeTab === 'EXPLORE' && index === 0 && !query) return null;

        return (
            <Link
                href={{
                    pathname: '/(student)/clubs/[id]',
                    params: { id: club.slug || club.id }
                }}
                asChild
            >
                <TouchableOpacity
                    className="mb-5"
                    activeOpacity={0.95}
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 12,
                        elevation: 4,
                    }}
                >
                    <View className="bg-card rounded-3xl overflow-hidden">
                        {/* Cover Image */}
                        <View style={{ height: 140 }}>
                            <Image
                                source={{ uri: club.logoUrl || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600' }}
                                style={{ width: '100%', height: '100%' }}
                                contentFit="cover"
                                transition={300}
                            />
                            {/* Gradient Overlay */}
                            <View
                                className="absolute inset-0"
                                style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}
                            />

                            {/* Member Badge */}
                            {isMember && (
                                <View className="absolute top-3 left-3 bg-white/90 px-3 py-1.5 rounded-full flex-row items-center">
                                    <View className="w-2 h-2 bg-success rounded-full mr-1.5" />
                                    <Text className="text-success text-xs font-bold">Member</Text>
                                </View>
                            )}

                            {/* Stats Overlay */}
                            <View className="absolute bottom-3 right-3 flex-row">
                                <View className="bg-black/50 backdrop-blur px-2.5 py-1.5 rounded-full flex-row items-center mr-2">
                                    <Users size={12} color="#FFF" />
                                    <Text className="text-white text-xs font-semibold ml-1.5">{memberCount}</Text>
                                </View>
                                <View className="bg-black/50 backdrop-blur px-2.5 py-1.5 rounded-full flex-row items-center">
                                    <Sparkles size={12} color="#FFF" />
                                    <Text className="text-white text-xs font-semibold ml-1.5">{eventCount}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Content */}
                        <View className="p-4">
                            <Text className="text-text font-bold text-lg mb-1" numberOfLines={1}>
                                {club.name}
                            </Text>
                            <Text className="text-text-secondary text-sm leading-5" numberOfLines={2}>
                                {club.description || 'Join us to explore and learn together!'}
                            </Text>

                            {/* View Button */}
                            <View className="flex-row justify-between items-center mt-4">
                                <View className="flex-row items-center">
                                    {club.leader && (
                                        <>
                                            <Crown size={14} color={COLORS.primary} />
                                            <Text className="text-primary text-xs font-medium ml-1.5">
                                                {club.leader.fullName || 'Leader'}
                                            </Text>
                                        </>
                                    )}
                                </View>
                                <View
                                    className="flex-row items-center px-4 py-2 rounded-full"
                                    style={{ backgroundColor: COLORS.primary }}
                                >
                                    <Text className="text-white text-sm font-bold">View</Text>
                                    <ChevronRight size={16} color="#FFF" className="ml-1" />
                                </View>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </Link>
        );
    };

    // Tab Button Component
    const TabButton = ({ value, label, count }: { value: 'EXPLORE' | 'MY_CLUBS'; label: string; count?: number }) => (
        <TouchableOpacity
            onPress={() => setActiveTab(value)}
            className={`mr-2 px-5 py-2.5 rounded-full flex-row items-center ${activeTab === value ? '' : 'bg-gray-100'}`}
            style={activeTab === value ? {
                backgroundColor: COLORS.primary,
                shadowColor: COLORS.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4
            } : {}}
            activeOpacity={0.8}
        >
            <Text className={`font-bold text-sm ${activeTab === value ? 'text-white' : 'text-text-secondary'}`}>
                {label}
            </Text>
            {count !== undefined && count > 0 && (
                <View className={`ml-2 px-1.5 py-0.5 rounded-md ${activeTab === value ? 'bg-white/20' : 'bg-gray-200'}`}>
                    <Text className={`text-[10px] font-bold ${activeTab === value ? 'text-white' : 'text-text-secondary'}`}>
                        {count}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );

    // Loading State
    if (loading && allClubs.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-background" edges={['top']}>
                <View className="px-5 pt-4 pb-4">
                    <Skeleton width={100} height={32} rounded={8} />
                    <View className="mt-2">
                        <Skeleton width={160} height={16} rounded={4} />
                    </View>
                </View>
                <View className="px-5 mb-4">
                    <Skeleton width="100%" height={48} rounded={24} />
                </View>
                <View className="flex-row px-5 mb-4">
                    <Skeleton width={100} height={40} rounded={20} />
                    <View className="ml-2">
                        <Skeleton width={100} height={40} rounded={20} />
                    </View>
                </View>
                <View className="px-5">
                    <ClubCardSkeleton />
                    <ClubCardSkeleton />
                    <ClubCardSkeleton />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            {/* Header */}
            <View className="px-5 pt-3 pb-2">
                <View className="flex-row justify-between items-center">
                    <View>
                        <Text className="text-text text-3xl font-extrabold">Clubs</Text>
                        <Text className="text-text-secondary text-sm">Find your community</Text>
                    </View>
                    <Link href="/(student)/clubs/my-applications" asChild>
                        <TouchableOpacity
                            className="bg-primary/10 p-3 rounded-full"
                            activeOpacity={0.7}
                        >
                            <Clock size={20} color={COLORS.primary} />
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>

            {/* Search Bar */}
            <View className="px-5 py-3">
                <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 h-12">
                    <Search size={20} color={COLORS.textSecondary} />
                    <TextInput
                        placeholder="Search clubs..."
                        className="flex-1 ml-3 text-text"
                        placeholderTextColor={COLORS.textSecondary}
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Text className="text-primary text-sm font-medium">Clear</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Tabs */}
            <View className="flex-row px-5 mb-4">
                <TabButton value="EXPLORE" label="Explore" count={exploreClubs.length} />
                <TabButton value="MY_CLUBS" label="My Clubs" count={myClubs.length} />
            </View>

            {/* Content */}
            <FlatList
                data={displayedClubs}
                renderItem={renderClubCard}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
                ListHeaderComponent={() => (
                    <>
                        {featuredClub && activeTab === 'EXPLORE' && (
                            <>
                                <View className="flex-row items-center mb-3">
                                    <Star size={16} color="#FFD700" fill="#FFD700" />
                                    <Text className="text-text font-bold ml-2">Spotlight</Text>
                                </View>
                                <FeaturedClubCard club={featuredClub} />
                            </>
                        )}
                        {displayedClubs.length > (featuredClub ? 1 : 0) && (
                            <View className="mb-3 mt-2">
                                <Text className="text-text font-bold text-base">
                                    {activeTab === 'EXPLORE'
                                        ? (query ? `Results for "${query}"` : 'All Clubs')
                                        : 'Your Memberships'}
                                </Text>
                            </View>
                        )}
                    </>
                )}
                ListEmptyComponent={() => (
                    <View className="items-center justify-center py-16">
                        <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-4">
                            {activeTab === 'EXPLORE' ? (
                                <Search size={32} color={COLORS.primary} />
                            ) : (
                                <Heart size={32} color={COLORS.primary} />
                            )}
                        </View>
                        <Text className="text-text font-bold text-lg mb-2">
                            {activeTab === 'EXPLORE' ? 'No clubs found' : 'No memberships yet'}
                        </Text>
                        <Text className="text-text-secondary text-sm text-center px-8">
                            {activeTab === 'EXPLORE'
                                ? 'Try a different search term'
                                : 'Join a club to see it here!'}
                        </Text>
                        {activeTab === 'MY_CLUBS' && (
                            <TouchableOpacity
                                className="mt-6 px-6 py-3 rounded-full"
                                style={{ backgroundColor: COLORS.primary }}
                                onPress={() => setActiveTab('EXPLORE')}
                            >
                                <Text className="text-white font-bold">Explore Clubs</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            />
        </SafeAreaView>
    );
}
