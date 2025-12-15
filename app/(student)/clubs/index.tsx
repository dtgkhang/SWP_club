import { useRouter } from 'expo-router';
import { ChevronRight, Search, Sparkles, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/theme';
import { useToast } from '../../../contexts/ToastContext';
import { authService } from '../../../services/auth.service';
import { Club, clubService } from '../../../services/club.service';

const { width } = Dimensions.get('window');

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

    // Tab Component
    const Tab = ({ label, value, count }: { label: string; value: 'EXPLORE' | 'MY_CLUBS'; count: number }) => (
        <TouchableOpacity
            onPress={() => setActiveTab(value)}
            className={`flex-1 py-3 items-center rounded-xl ${activeTab === value ? 'bg-primary' : 'bg-transparent'}`}
        >
            <Text className={`font-bold ${activeTab === value ? 'text-white' : 'text-text-secondary'}`}>
                {label} ({count})
            </Text>
        </TouchableOpacity>
    );

    // Club Card
    const ClubCard = ({ club, isMember }: { club: Club; isMember: boolean }) => (
        <TouchableOpacity
            className="bg-card rounded-2xl mb-3 overflow-hidden border border-border"
            onPress={() => router.push({
                pathname: '/(student)/clubs/[id]' as any,
                params: { id: club.slug || club.id, isMember: isMember ? 'true' : 'false' }
            })}
            activeOpacity={0.7}
        >
            <View className="flex-row">
                <Image
                    source={{ uri: club.logoUrl || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200' }}
                    className="w-24 h-24"
                    resizeMode="cover"
                />
                <View className="flex-1 p-3 justify-center">
                    <View className="flex-row items-center mb-1">
                        <Text className="text-text font-bold text-base flex-1" numberOfLines={1}>{club.name}</Text>
                        {isMember && (
                            <View className="bg-success-soft px-2 py-0.5 rounded">
                                <Text className="text-success text-xs font-bold">Member</Text>
                            </View>
                        )}
                    </View>
                    <Text className="text-text-secondary text-xs mb-2" numberOfLines={1}>
                        {club.description || 'No description'}
                    </Text>
                    <View className="flex-row items-center">
                        <Users size={12} color={COLORS.secondary} />
                        <Text className="text-secondary text-xs font-medium ml-1">
                            {club._count?.memberships || 0} members
                        </Text>
                        <View className="w-1 h-1 bg-border rounded-full mx-2" />
                        <Sparkles size={12} color={COLORS.primary} />
                        <Text className="text-primary text-xs font-medium ml-1">
                            {club._count?.events || 0} events
                        </Text>
                    </View>
                </View>
                <View className="justify-center pr-3">
                    <ChevronRight size={18} color={COLORS.border} />
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            {/* Header */}
            <View className="px-5 pt-2 pb-4">
                <Text className="text-text text-2xl font-bold mb-1">Clubs</Text>
                <Text className="text-text-secondary text-sm">Discover and join student clubs</Text>
            </View>

            {/* Search Bar */}
            <View className="px-5 mb-4">
                <View className="flex-row items-center bg-card border border-border rounded-2xl px-4 h-12">
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
            <View className="mx-5 mb-4 p-1 bg-card border border-border rounded-2xl flex-row">
                <Tab label="Explore" value="EXPLORE" count={exploreClubs.length} />
                <Tab label="My Clubs" value="MY_CLUBS" count={myClubs.length} />
            </View>

            {/* Content */}
            <ScrollView
                className="flex-1 px-5"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {loading ? (
                    <View className="py-10">
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : displayedClubs.length > 0 ? (
                    displayedClubs.map(club => (
                        <ClubCard
                            key={club.id}
                            club={club}
                            isMember={myClubIds.includes(club.id)}
                        />
                    ))
                ) : (
                    <View className="items-center justify-center py-16">
                        <Text className="text-6xl mb-4">
                            {activeTab === 'EXPLORE' ? '🔍' : '📭'}
                        </Text>
                        <Text className="text-text font-bold text-lg">
                            {activeTab === 'EXPLORE' ? 'No clubs to explore' : 'No clubs joined yet'}
                        </Text>
                        <Text className="text-text-secondary text-sm mt-1 text-center px-8">
                            {activeTab === 'EXPLORE'
                                ? 'You have joined all available clubs!'
                                : 'Explore clubs and join to see them here'}
                        </Text>
                        {activeTab === 'MY_CLUBS' && (
                            <TouchableOpacity
                                className="mt-4 bg-primary px-6 py-3 rounded-xl"
                                onPress={() => setActiveTab('EXPLORE')}
                            >
                                <Text className="text-white font-bold">Explore Clubs</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
