
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Bell, Calendar, ChevronRight, MapPin, Search, Sparkles, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, DimensionValue, Dimensions, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { useToast } from '../../contexts/ToastContext';
import { authService } from '../../services/auth.service';
import { Event, eventService } from '../../services/event.service';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

// Skeleton Component
const Skeleton = ({ width: w, height, rounded = 8, className = '' }: { width: DimensionValue; height: number; rounded?: number; className?: string }) => (
    <View
        className={`bg-border/40 ${className}`}
        style={{ width: w, height, borderRadius: rounded }}
    />
);

// Home Loading Skeleton
const HomeSkeleton = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header Skeleton */}
        <View className="px-5 pt-2 pb-4">
            <View className="flex-row justify-between items-center mb-5">
                <View>
                    <Skeleton width={100} height={14} rounded={4} />
                    <View className="mt-2">
                        <Skeleton width={160} height={24} rounded={6} />
                    </View>
                </View>
                <View className="flex-row">
                    <Skeleton width={44} height={44} rounded={12} className="mr-2" />
                    <Skeleton width={44} height={44} rounded={12} />
                </View>
            </View>
            <Skeleton width="100%" height={56} rounded={16} />
        </View>

        {/* Stats Skeleton */}
        <View className="flex-row px-5 mb-5">
            <View className="flex-1 mr-3">
                <Skeleton width="100%" height={80} rounded={16} />
            </View>
            <View className="flex-1">
                <Skeleton width="100%" height={80} rounded={16} />
            </View>
        </View>

        {/* Featured Skeleton */}
        <View className="px-5 mb-6">
            <Skeleton width={140} height={20} rounded={6} className="mb-4" />
            <Skeleton width={CARD_WIDTH} height={208} rounded={24} />
        </View>

        {/* Filter Skeleton */}
        <View className="flex-row px-5 mb-4">
            <Skeleton width={70} height={40} rounded={12} className="mr-2" />
            <Skeleton width={80} height={40} rounded={12} className="mr-2" />
            <Skeleton width={90} height={40} rounded={12} />
        </View>

        {/* Events Skeleton */}
        <View className="px-5">
            <Skeleton width={140} height={20} rounded={6} className="mb-4" />
            {[1, 2, 3].map(i => (
                <View key={i} className="mb-3">
                    <Skeleton width="100%" height={110} rounded={16} />
                </View>
            ))}
        </View>
    </ScrollView>
);

export default function StudentHome() {
    const router = useRouter();
    const { showError } = useToast();
    const [filter, setFilter] = useState('ALL');
    const [user, setUser] = useState<any>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Reload events when filter or search changes
    useEffect(() => {
        loadEvents();
    }, [filter, debouncedSearch, user]);

    const loadProfile = async () => {
        try {
            const { user: profile } = await authService.getProfile();
            setUser(profile);
        } catch (error: any) {
            showError('Profile Error', 'Could not load your profile');
        }
    };

    // Get user's club IDs from memberships
    const getUserClubIds = (): string[] => {
        if (!user?.memberships) return [];
        return user.memberships
            .filter((m: any) => m.status === 'ACTIVE')
            .map((m: any) => m.clubId);
    };

    const loadEvents = async () => {
        try {
            setLoading(true);

            // For MY_CLUBS, fetch all events and filter client-side
            // For PUBLIC/ALL, use BE filter
            const typeFilter = filter === 'ALL' || filter === 'MY_CLUBS' ? undefined : filter;

            const data = await eventService.getAllEvents({
                type: typeFilter,
                search: debouncedSearch || undefined
            });

            // Client-side filter for MY_CLUBS
            if (filter === 'MY_CLUBS') {
                const userClubIds = getUserClubIds();
                const filtered = data.filter(e => userClubIds.includes(e.clubId));
                setEvents(filtered);
            } else {
                setEvents(data);
            }
        } catch (error: any) {
            showError('Loading Failed', 'Could not load events. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Featured Event Card (First event)
    const FeaturedEventCard = ({ event }: { event: Event }) => (
        <TouchableOpacity
            className="mb-6"
            onPress={() => router.push(`/(student)/events/${event.id}`)}
            activeOpacity={0.9}
        >
            <View className="rounded-3xl overflow-hidden" style={{ width: CARD_WIDTH }}>
                <Image
                    source={{ uri: event.club?.logoUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600' }}
                    style={{ width: '100%', height: 208 }}
                    contentFit="cover"
                    transition={500}
                />
                <View className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Content Overlay */}
                <View className="absolute bottom-0 left-0 right-0 p-5">
                    <View className="flex-row items-center mb-2">
                        <View className="bg-primary px-3 py-1 rounded-full mr-2">
                            <Text className="text-white text-xs font-bold">
                                {event.pricingType === 'FREE' ? 'FREE' : `${(event.price ?? 0).toLocaleString()}₫`}
                            </Text>
                        </View>
                        <View className="bg-white/20 px-3 py-1 rounded-full">
                            <Text className="text-white text-xs font-medium">{event.type}</Text>
                        </View>
                    </View>
                    <Text className="text-white text-xl font-bold mb-2">{event.title}</Text>
                    <View className="flex-row items-center">
                        <Calendar size={14} color="#FFF" />
                        <Text className="text-white/80 text-sm ml-2">
                            {event.startTime
                                ? new Date(event.startTime).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'short' })
                                : 'Coming soon'}
                        </Text>
                        <View className="w-1 h-1 bg-white/50 rounded-full mx-3" />
                        <MapPin size={14} color="#FFF" />
                        <Text className="text-white/80 text-sm ml-2">{event.location || 'TBD'}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    // Regular Event Card - Premium Design
    const EventCard = ({ event }: { event: Event }) => (
        <TouchableOpacity
            className="bg-card rounded-2xl mb-3 overflow-hidden border border-border shadow-sm"
            onPress={() => router.push(`/(student)/events/${event.id}`)}
            activeOpacity={0.8}
            style={{ height: 110 }}
        >
            <View className="flex-row h-full">
                {/* Image */}
                <Image
                    source={{ uri: event.club?.logoUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300' }}
                    style={{ width: 100, height: '100%' }}
                    contentFit="cover"
                    transition={300}
                />

                {/* Content */}
                <View className="flex-1 p-3 justify-between" style={{ minWidth: 0 }}>
                    {/* Top Section */}
                    <View style={{ minWidth: 0 }}>
                        <View className="flex-row items-center mb-1.5">
                            <View className={`px-2 py-0.5 rounded-md ${event.pricingType === 'FREE' ? 'bg-success-soft' : 'bg-primary-soft'}`}>
                                <Text className={`text-xs font-bold ${event.pricingType === 'FREE' ? 'text-success' : 'text-primary'}`}>
                                    {event.pricingType === 'FREE' ? 'FREE' : `${(event.price ?? 0).toLocaleString()}₫`}
                                </Text>
                            </View>
                            <View className="bg-secondary-soft px-2 py-0.5 rounded-md ml-1.5">
                                <Text className="text-secondary text-xs font-medium">{event.type}</Text>
                            </View>
                        </View>
                        <Text
                            className="text-text font-bold text-base"
                            numberOfLines={2}
                            style={{ lineHeight: 20 }}
                        >
                            {event.title}
                        </Text>
                    </View>

                    {/* Bottom Section */}
                    <View className="flex-row items-center" style={{ minWidth: 0 }}>
                        <Calendar size={11} color={COLORS.textSecondary} />
                        <Text className="text-text-secondary text-xs ml-1" numberOfLines={1}>
                            {event.startTime
                                ? new Date(event.startTime).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })
                                : 'TBD'}
                        </Text>
                        <Text className="text-text-secondary text-xs mx-1">•</Text>
                        <Text className="text-primary text-xs font-medium flex-shrink" numberOfLines={1} style={{ flex: 1 }}>
                            {event.club?.name}
                        </Text>
                    </View>
                </View>

                {/* Arrow */}
                <View className="justify-center pr-2">
                    <View className="w-7 h-7 bg-background rounded-full items-center justify-center">
                        <ChevronRight size={16} color={COLORS.primary} />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    const FilterChip = ({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) => (
        <TouchableOpacity
            onPress={() => setFilter(value)}
            className={`px-4 py-2.5 rounded-xl mr-2 flex-row items-center ${filter === value
                ? 'bg-primary'
                : 'bg-card border border-border'
                }`}
        >
            {Icon && <Icon size={14} color={filter === value ? '#FFF' : COLORS.textSecondary} style={{ marginRight: 6 }} />}
            <Text className={`font-semibold text-sm ${filter === value ? 'text-white' : 'text-text-secondary'}`}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                >
                    {/* Header */}
                    <View className="px-5 pt-2 pb-4">
                        <View className="flex-row justify-between items-center mb-5">
                            <View className="flex-1">
                                <Text className="text-text-secondary text-sm">Welcome back 👋</Text>
                                <Text className="text-text text-2xl font-bold">{user?.fullName || 'Student'}</Text>
                            </View>
                            <TouchableOpacity className="w-11 h-11 bg-card border border-border rounded-xl items-center justify-center mr-2">
                                <Bell size={20} color={COLORS.text} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="w-11 h-11 bg-primary rounded-xl items-center justify-center"
                                onPress={() => router.push('/(student)/profile')}
                            >
                                <Text className="text-white font-bold text-base">
                                    {(user?.fullName || 'U').charAt(0).toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Search Bar */}
                        <View className="flex-row items-center bg-card border border-border rounded-2xl px-4 h-14">
                            <Search size={20} color={COLORS.textSecondary} />
                            <TextInput
                                placeholder="Search events, clubs..."
                                className="flex-1 ml-3 text-text text-base"
                                placeholderTextColor="#94A3B8"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                    </View>

                    {/* Quick Stats */}
                    <View className="flex-row px-5 mb-5">
                        <TouchableOpacity
                            className="flex-1 bg-secondary p-4 rounded-2xl mr-3"
                            onPress={() => router.push('/(student)/clubs')}
                        >
                            <View className="flex-row items-center justify-between">
                                <View>
                                    <Text className="text-white/80 text-xs font-medium">Explore</Text>
                                    <Text className="text-white text-xl font-bold">Clubs</Text>
                                </View>
                                <View className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center">
                                    <Users size={20} color="#FFF" />
                                </View>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity className="flex-1 bg-primary p-4 rounded-2xl">
                            <View className="flex-row items-center justify-between">
                                <View>
                                    <Text className="text-white/80 text-xs font-medium">Active</Text>
                                    <Text className="text-white text-xl font-bold">{events.length} Events</Text>
                                </View>
                                <View className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center">
                                    <Sparkles size={20} color="#FFF" />
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Featured Section */}
                    {events.length > 0 && (
                        <View className="px-5 mb-2">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-text text-lg font-bold">🔥 Featured Event</Text>
                            </View>
                            <FeaturedEventCard event={events[0]} />
                        </View>
                    )}

                    {/* Filter Chips */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="mb-4"
                        contentContainerStyle={{ paddingHorizontal: 20 }}
                    >
                        <FilterChip label="All" value="ALL" icon={Sparkles} />
                        <FilterChip label="Public" value="PUBLIC" />
                        <FilterChip label="My Clubs" value="MY_CLUBS" />
                    </ScrollView>

                    {/* Events List */}
                    <View className="px-5">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-text text-lg font-bold">Upcoming Events</Text>
                            <TouchableOpacity>
                                <Text className="text-primary font-medium text-sm">See All</Text>
                            </TouchableOpacity>
                        </View>

                        {loading ? (
                            <View className="py-10">
                                <ActivityIndicator size="large" color={COLORS.primary} />
                            </View>
                        ) : events.length > 1 ? (
                            events.slice(1).map((event: Event) => (
                                <EventCard key={event.id} event={event} />
                            ))
                        ) : events.length === 0 ? (
                            <View className="items-center justify-center py-16">
                                <Text className="text-6xl mb-4">📭</Text>
                                <Text className="text-text font-bold text-lg">No events found</Text>
                                <Text className="text-text-secondary text-sm mt-1">Check back later for new events</Text>
                            </View>
                        ) : null}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
