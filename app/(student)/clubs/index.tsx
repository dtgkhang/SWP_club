import { useRouter } from 'expo-router';
import { ChevronRight, Filter, Search, Sparkles, TrendingUp, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/theme';
import { useToast } from '../../../contexts/ToastContext';
import { Club, clubService } from '../../../services/club.service';

const { width } = Dimensions.get('window');

export default function ClubList() {
    const router = useRouter();
    const { showError } = useToast();
    const [clubs, setClubs] = useState<Club[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Reload clubs when search changes
    useEffect(() => {
        loadClubs();
    }, [debouncedSearch]);

    const loadClubs = async () => {
        try {
            setLoading(true);
            const result = await clubService.getAllClubs(1, 20, debouncedSearch || undefined);
            setClubs(result.clubs || []);
        } catch (error: any) {
            showError('Loading Failed', 'Could not load clubs. Please try again.');
        } finally {
            setLoading(false);
        }
    };


    // Featured Club Card (Large)
    const FeaturedClubCard = ({ club }: { club: Club }) => (
        <TouchableOpacity
            className="mr-4"
            onPress={() => router.push(`/(student)/clubs/${club.slug || club.id}`)}
            activeOpacity={0.9}
            style={{ width: width * 0.7 }}
        >
            <View className="rounded-3xl overflow-hidden bg-card border border-border">
                <Image
                    source={{ uri: club.logoUrl || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400' }}
                    className="w-full h-36"
                    resizeMode="cover"
                />
                <View className="p-4">
                    <Text className="text-text font-bold text-lg mb-1" numberOfLines={1}>{club.name}</Text>
                    <Text className="text-text-secondary text-sm mb-3" numberOfLines={2}>
                        {club.description || 'Join us to explore and grow together!'}
                    </Text>
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                            <View className="bg-secondary-soft px-2.5 py-1 rounded-lg flex-row items-center">
                                <Users size={12} color={COLORS.secondary} />
                                <Text className="text-secondary text-xs font-bold ml-1">
                                    {club._count?.memberships || 0}
                                </Text>
                            </View>
                            <View className="bg-primary-soft px-2.5 py-1 rounded-lg flex-row items-center ml-2">
                                <Sparkles size={12} color={COLORS.primary} />
                                <Text className="text-primary text-xs font-bold ml-1">
                                    {club._count?.events || 0} events
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    // Compact Club Card
    const ClubCard = ({ club }: { club: Club }) => (
        <TouchableOpacity
            className="bg-card rounded-2xl mb-3 overflow-hidden border border-border"
            onPress={() => router.push(`/(student)/clubs/${club.slug || club.id}`)}
            activeOpacity={0.7}
        >
            <View className="flex-row">
                <Image
                    source={{ uri: club.logoUrl || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200' }}
                    className="w-24 h-24"
                    resizeMode="cover"
                />
                <View className="flex-1 p-3 justify-center">
                    <Text className="text-text font-bold text-base mb-1" numberOfLines={1}>{club.name}</Text>
                    <Text className="text-text-secondary text-xs mb-2" numberOfLines={1}>
                        {club.description || 'No description'}
                    </Text>
                    <View className="flex-row items-center">
                        <Users size={12} color={COLORS.secondary} />
                        <Text className="text-secondary text-xs font-medium ml-1">
                            {club._count?.memberships || 0} members
                        </Text>
                    </View>
                </View>
                <View className="justify-center pr-3">
                    <View className="w-8 h-8 bg-background rounded-full items-center justify-center">
                        <ChevronRight size={16} color={COLORS.textSecondary} />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Header */}
                <View className="px-5 pt-2 pb-4">
                    <View className="flex-row justify-between items-center mb-2">
                        <View>
                            <Text className="text-text text-2xl font-bold">Explore Clubs</Text>
                            <Text className="text-text-secondary text-sm">Find your community</Text>
                        </View>
                        <TouchableOpacity className="w-10 h-10 bg-card border border-border rounded-xl items-center justify-center">
                            <Filter size={18} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search Bar */}
                <View className="px-5 mb-5">
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

                {/* Stats Banner */}
                <View className="mx-5 mb-5 bg-secondary p-4 rounded-2xl flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <View className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center mr-3">
                            <TrendingUp size={20} color="#FFF" />
                        </View>
                        <View>
                            <Text className="text-white/80 text-xs">Total</Text>
                            <Text className="text-white font-bold text-lg">{clubs.length} Clubs</Text>
                        </View>
                    </View>
                    <TouchableOpacity className="bg-white/20 px-4 py-2 rounded-xl">
                        <Text className="text-white font-medium text-sm">View All</Text>
                    </TouchableOpacity>
                </View>

                {/* Featured Clubs - Horizontal Scroll */}
                {!loading && clubs.length > 0 && (
                    <View className="mb-6">
                        <View className="flex-row justify-between items-center px-5 mb-3">
                            <Text className="text-text font-bold text-lg">🌟 Popular Clubs</Text>
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingLeft: 20, paddingRight: 10 }}
                        >
                            {clubs.slice(0, 3).map((club: Club) => (
                                <FeaturedClubCard key={club.id} club={club} />
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* All Clubs List */}
                <View className="px-5">
                    <Text className="text-text font-bold text-lg mb-4">All Clubs</Text>

                    {loading ? (
                        <View className="py-10">
                            <ActivityIndicator size="large" color={COLORS.primary} />
                        </View>
                    ) : clubs.length > 0 ? (
                        clubs.map((club: Club) => (
                            <ClubCard key={club.id} club={club} />
                        ))
                    ) : (
                        <View className="items-center justify-center py-16">
                            <Text className="text-6xl mb-4">🔍</Text>
                            <Text className="text-text font-bold text-lg">No clubs found</Text>
                            <Text className="text-text-secondary text-sm mt-1">Try a different search term</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
