import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { ChevronRight, Clock, Crown, Search, Sparkles, Star, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/theme';
import { useToast } from '../../../contexts/ToastContext';
import { authService } from '../../../services/auth.service';
import { Club, clubService } from '../../../services/club.service';

export default function ClubList() {
    const { showError } = useToast();
    const [activeTab, setActiveTab] = useState<'EXPLORE' | 'MY_CLUBS'>('EXPLORE');
    const [allClubs, setAllClubs] = useState<Club[]>([]);
    const [myClubIds, setMyClubIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
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
        }
    };

    // Simple filter
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

    const renderClubCard = ({ item: club, index }: { item: Club; index: number }) => {
        const isMember = myClubIds.includes(club.id);
        const memberCount = club._count?.memberships || 0;
        const eventCount = club._count?.events || 0;

        return (
            <Link
                href={{
                    pathname: '/(student)/clubs/[id]',
                    params: { id: club.slug || club.id }
                }}
                asChild
            >
                <TouchableOpacity
                    className="mx-5 mb-4 bg-card rounded-3xl overflow-hidden border border-border"
                    activeOpacity={0.8}
                >
                    <View className="relative">
                        <Image
                            source={{ uri: club.logoUrl || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400' }}
                            style={{ width: '100%', height: 140 }}
                            contentFit="cover"
                        />
                        <View className="absolute inset-0 bg-black/40" />

                        {isMember && (
                            <View className="absolute top-3 right-3 bg-success px-3 py-1 rounded-full flex-row items-center">
                                <Star size={12} color="#FFF" fill="#FFF" />
                                <Text className="text-white text-xs font-bold ml-1">Member</Text>
                            </View>
                        )}

                        {index === 0 && activeTab === 'EXPLORE' && (
                            <View className="absolute top-3 left-3 bg-primary px-3 py-1 rounded-full flex-row items-center">
                                <Crown size={12} color="#FFF" />
                                <Text className="text-white text-xs font-bold ml-1">Featured</Text>
                            </View>
                        )}

                        <View className="absolute bottom-0 left-0 right-0 p-4">
                            <Text className="text-white text-lg font-bold" numberOfLines={1}>
                                {club.name}
                            </Text>
                            <Text className="text-white/80 text-sm" numberOfLines={2}>
                                {club.description || 'A great club to join!'}
                            </Text>
                        </View>
                    </View>

                    <View className="p-4 flex-row items-center justify-between">
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
                            <ChevronRight size={14} color={COLORS.primary} />
                        </View>
                    </View>
                </TouchableOpacity>
            </Link>
        );
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-background justify-center items-center">
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            {/* Header */}
            <View className="px-5 pt-4 pb-4 flex-row justify-between items-center">
                <View>
                    <Text className="text-text text-2xl font-bold">Clubs</Text>
                    <Text className="text-text-secondary text-sm">Discover amazing student clubs</Text>
                </View>
                <Link href="/(student)/clubs/my-applications" asChild>
                    <TouchableOpacity className="w-11 h-11 bg-card rounded-xl items-center justify-center border border-border">
                        <Clock size={20} color={COLORS.text} />
                    </TouchableOpacity>
                </Link>
            </View>

            {/* Search */}
            <View className="px-5 mb-4">
                <View className="flex-row items-center bg-card border border-border rounded-2xl px-4 h-14">
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

            {/* Tabs */}
            <View className="mx-5 mb-3 p-1.5 bg-card border border-border rounded-2xl flex-row">
                <TouchableOpacity
                    onPress={() => setActiveTab('EXPLORE')}
                    className={`flex-1 py-3 items-center rounded-xl flex-row justify-center ${activeTab === 'EXPLORE' ? 'bg-primary' : ''}`}
                >
                    <Search size={16} color={activeTab === 'EXPLORE' ? '#FFF' : COLORS.textSecondary} />
                    <Text className={`font-bold ml-2 ${activeTab === 'EXPLORE' ? 'text-white' : 'text-text-secondary'}`}>
                        Explore ({exploreClubs.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setActiveTab('MY_CLUBS')}
                    className={`flex-1 py-3 items-center rounded-xl flex-row justify-center ${activeTab === 'MY_CLUBS' ? 'bg-primary' : ''}`}
                >
                    <Star size={16} color={activeTab === 'MY_CLUBS' ? '#FFF' : COLORS.textSecondary} />
                    <Text className={`font-bold ml-2 ${activeTab === 'MY_CLUBS' ? 'text-white' : 'text-text-secondary'}`}>
                        My Clubs ({myClubs.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* List */}
            <FlatList
                data={displayedClubs}
                renderItem={renderClubCard}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                    <View className="items-center justify-center py-16 px-8">
                        <Text className="text-4xl mb-4">{activeTab === 'EXPLORE' ? '🎉' : '🔍'}</Text>
                        <Text className="text-text font-bold text-lg text-center">
                            {activeTab === 'EXPLORE' ? "You've joined all clubs!" : 'No clubs joined yet'}
                        </Text>
                        <Text className="text-text-secondary text-sm mt-2 text-center">
                            {activeTab === 'EXPLORE' ? 'Great job!' : 'Explore clubs and join to see them here'}
                        </Text>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}
