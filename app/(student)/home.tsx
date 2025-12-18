
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Bell, Calendar, ChevronRight, Clock, MapPin, Search, Sparkles, Star, TrendingUp, Users, Video, Zap } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, DimensionValue, Dimensions, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { useToast } from '../../contexts/ToastContext';
import { authService } from '../../services/auth.service';
import { Event, eventService } from '../../services/event.service';

// Event placeholder image for when no image is available or loading fails
const EVENT_PLACEHOLDER = require('../../assets/images/event-placeholder.png');

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;
const HORIZONTAL_CARD_WIDTH = width * 0.75;

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
        <View className="px-5 pt-2 pb-4">
            <View className="flex-row justify-between items-center mb-5">
                <View>
                    <Skeleton width={100} height={14} rounded={4} />
                    <View className="mt-2">
                        <Skeleton width={160} height={24} rounded={6} />
                    </View>
                </View>
                <View className="flex-row">
                    <Skeleton width={44} height={44} rounded={22} className="mr-2" />
                    <Skeleton width={44} height={44} rounded={22} />
                </View>
            </View>
            <Skeleton width="100%" height={56} rounded={28} />
        </View>
        <View className="px-5 mb-6">
            <Skeleton width={140} height={20} rounded={6} className="mb-4" />
            <Skeleton width={CARD_WIDTH} height={220} rounded={24} />
        </View>
        <View className="px-5">
            {[1, 2, 3].map(i => (
                <View key={i} className="mb-3">
                    <Skeleton width="100%" height={140} rounded={20} />
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

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

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

    const getUserClubIds = (): string[] => {
        if (!user?.memberships) return [];
        return user.memberships
            .filter((m: any) => m.status === 'ACTIVE')
            .map((m: any) => m.clubId);
    };

    const loadEvents = async () => {
        try {
            setLoading(true);
            const typeFilter = filter === 'ALL' || filter === 'MY_CLUBS' ? undefined : filter;
            const data = await eventService.getAllEvents({ type: typeFilter });

            // TEMPORARILY DISABLED: endTime filter
            // const now = new Date();
            // const availableEvents = data.filter((event: any) => {
            //     if (event.endTime) {
            //         const endTime = new Date(event.endTime);
            //         if (endTime < now) return false;
            //     }
            //     return true;
            // });
            const availableEvents = data; // Show all events

            const searchFilter = (events: Event[]) => {
                if (!debouncedSearch.trim()) return events;
                const query = debouncedSearch.toLowerCase();
                return events.filter(e =>
                    e.title?.toLowerCase().includes(query) ||
                    e.description?.toLowerCase().includes(query) ||
                    e.location?.toLowerCase().includes(query) ||
                    e.club?.name?.toLowerCase().includes(query)
                );
            };

            const searchedEvents = searchFilter(availableEvents);

            if (filter === 'MY_CLUBS') {
                const userClubIds = getUserClubIds();
                const filtered = searchedEvents.filter(e => userClubIds.includes(e.clubId));
                setEvents(filtered);
            } else {
                setEvents(searchedEvents);
            }
        } catch (error: any) {
            showError('Loading Failed', 'Could not load events. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Hero Featured Event Card - Premium Design
    const HeroEventCard = ({ event }: { event: Event }) => {
        const isPaid = event.pricingType !== 'FREE';
        const isOnline = event.format === 'ONLINE';

        return (
            <TouchableOpacity
                className="mb-6"
                onPress={() => router.push(`/(student)/events/${event.id}`)}
                activeOpacity={0.95}
            >
                <View
                    className="rounded-3xl overflow-hidden shadow-xl"
                    style={{
                        width: CARD_WIDTH,
                        height: 240,
                        shadowColor: COLORS.primary,
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.3,
                        shadowRadius: 16,
                        elevation: 12,
                    }}
                >
                    <Image
                        source={event.imageUrl ? { uri: event.imageUrl } : (event.club?.logoUrl ? { uri: event.club.logoUrl } : EVENT_PLACEHOLDER)}
                        placeholder={EVENT_PLACEHOLDER}
                        style={{ width: '100%', height: '100%', position: 'absolute' }}
                        contentFit="cover"
                        transition={500}
                    />
                    {/* Gradient Overlay - handled by second View with NativeWind */}
                    <View className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                    {/* Featured Badge */}
                    <View className="absolute top-4 left-4">
                        <View
                            className="flex-row items-center px-3 py-1.5 rounded-full"
                            style={{ backgroundColor: 'rgba(255, 200, 0, 0.9)' }}
                        >
                            <Star size={12} color="#000" fill="#000" />
                            <Text className="text-black text-xs font-bold ml-1">FEATURED</Text>
                        </View>
                    </View>

                    {/* Price Badge */}
                    <View className="absolute top-4 right-4">
                        <View
                            className="px-4 py-2 rounded-xl"
                            style={{
                                backgroundColor: isPaid ? COLORS.primary : COLORS.success,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.3,
                                shadowRadius: 4,
                            }}
                        >
                            <Text className="text-white text-sm font-bold">
                                {isPaid ? `${(event.price ?? 0).toLocaleString()}₫` : 'FREE'}
                            </Text>
                        </View>
                    </View>

                    {/* Content */}
                    <View className="absolute bottom-0 left-0 right-0 p-5">
                        {/* Tags Row */}
                        <View className="flex-row items-center mb-3">
                            {isOnline && (
                                <View className="bg-purple-500 px-3 py-1 rounded-full mr-2 flex-row items-center">
                                    <Video size={12} color="#FFF" />
                                    <Text className="text-white text-xs font-bold ml-1">ONLINE</Text>
                                </View>
                            )}
                            <View className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                                <Text className="text-white text-xs font-semibold">{event.type}</Text>
                            </View>
                        </View>

                        {/* Title */}
                        <Text
                            className="text-white text-2xl font-bold mb-3"
                            style={{
                                textShadowColor: 'rgba(0,0,0,0.8)',
                                textShadowOffset: { width: 0, height: 2 },
                                textShadowRadius: 8
                            }}
                            numberOfLines={2}
                        >
                            {event.title}
                        </Text>

                        {/* Meta Info */}
                        <View className="flex-row items-center">
                            <View className="flex-row items-center bg-white/15 px-3 py-1.5 rounded-full mr-3">
                                <Calendar size={14} color="#FFF" />
                                <Text className="text-white text-sm ml-2 font-medium">
                                    {event.startTime
                                        ? new Date(event.startTime).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'short' })
                                        : 'Coming soon'}
                                </Text>
                            </View>
                            <View className="flex-row items-center bg-white/15 px-3 py-1.5 rounded-full flex-1">
                                {isOnline ? (
                                    <>
                                        <Video size={14} color="#FFF" />
                                        <Text className="text-white text-sm ml-2 font-medium" numberOfLines={1}>Online</Text>
                                    </>
                                ) : (
                                    <>
                                        <MapPin size={14} color="#FFF" />
                                        <Text className="text-white text-sm ml-2 font-medium" numberOfLines={1}>{event.location || 'TBD'}</Text>
                                    </>
                                )}
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    // Modern Event Card with Glassmorphism
    const EventCard = ({ event, index }: { event: Event; index: number }) => {
        const isPaid = event.pricingType !== 'FREE';
        const isOnline = event.format === 'ONLINE';

        return (
            <TouchableOpacity
                className="mb-4"
                onPress={() => router.push(`/(student)/events/${event.id}`)}
                activeOpacity={0.9}
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    elevation: 6,
                }}
            >
                <View
                    className="rounded-2xl overflow-hidden bg-card border border-border"
                    style={{ height: 150 }}
                >
                    <View className="flex-row h-full">
                        {/* Image Section with Overlay */}
                        <View style={{ width: 130, position: 'relative' }}>
                            <Image
                                source={event.imageUrl ? { uri: event.imageUrl } : (event.club?.logoUrl ? { uri: event.club.logoUrl } : EVENT_PLACEHOLDER)}
                                placeholder={EVENT_PLACEHOLDER}
                                style={{ width: '100%', height: '100%' }}
                                contentFit="cover"
                                transition={300}
                            />
                            {/* Gradient overlay on image */}
                            <View
                                className="absolute inset-0"
                                style={{
                                    backgroundColor: 'rgba(0,0,0,0.2)',
                                }}
                            />
                            {/* Price badge on image */}
                            <View
                                className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg"
                                style={{
                                    backgroundColor: isPaid ? COLORS.primary : COLORS.success,
                                }}
                            >
                                <Text className="text-white text-xs font-bold">
                                    {isPaid ? `${(event.price ?? 0).toLocaleString()}₫` : 'FREE'}
                                </Text>
                            </View>
                        </View>

                        {/* Content Section */}
                        <View className="flex-1 p-4 justify-between">
                            {/* Top - Tags & Title */}
                            <View>
                                <View className="flex-row items-center mb-2 flex-wrap gap-1.5">
                                    {isOnline && (
                                        <View className="bg-purple-500/20 px-2 py-0.5 rounded-md">
                                            <Text className="text-purple-600 text-xs font-bold">🎥 ONLINE</Text>
                                        </View>
                                    )}
                                    <View className="bg-secondary-soft px-2 py-0.5 rounded-md">
                                        <Text className="text-secondary text-xs font-semibold">{event.type}</Text>
                                    </View>
                                </View>
                                <Text
                                    className="text-text font-bold text-base"
                                    numberOfLines={2}
                                    style={{ lineHeight: 22 }}
                                >
                                    {event.title}
                                </Text>
                            </View>

                            {/* Bottom - Meta Info */}
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center flex-1">
                                    <View className="flex-row items-center mr-4">
                                        <View className="w-6 h-6 bg-primary-soft rounded-full items-center justify-center">
                                            <Calendar size={12} color={COLORS.primary} />
                                        </View>
                                        <Text className="text-text-secondary text-xs ml-1.5 font-medium">
                                            {event.startTime
                                                ? new Date(event.startTime).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })
                                                : 'TBD'}
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center flex-1">
                                        <View className="w-6 h-6 bg-secondary-soft rounded-full items-center justify-center">
                                            <Users size={12} color={COLORS.secondary} />
                                        </View>
                                        <Text className="text-primary text-xs ml-1.5 font-semibold" numberOfLines={1}>
                                            {event.club?.name}
                                        </Text>
                                    </View>
                                </View>

                                {/* Arrow Button */}
                                <View
                                    className="w-9 h-9 rounded-xl items-center justify-center"
                                    style={{ backgroundColor: COLORS.primary + '15' }}
                                >
                                    <ChevronRight size={18} color={COLORS.primary} />
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    // Horizontal Trending Card
    const TrendingCard = ({ event }: { event: Event }) => {
        const isPaid = event.pricingType !== 'FREE';

        return (
            <TouchableOpacity
                className="mr-4"
                onPress={() => router.push(`/(student)/events/${event.id}`)}
                activeOpacity={0.9}
                style={{ width: HORIZONTAL_CARD_WIDTH }}
            >
                <View
                    className="rounded-2xl overflow-hidden"
                    style={{
                        height: 180,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.15,
                        shadowRadius: 8,
                        elevation: 5,
                    }}
                >
                    <Image
                        source={event.imageUrl ? { uri: event.imageUrl } : (event.club?.logoUrl ? { uri: event.club.logoUrl } : EVENT_PLACEHOLDER)}
                        placeholder={EVENT_PLACEHOLDER}
                        style={{ width: '100%', height: '100%', position: 'absolute' }}
                        contentFit="cover"
                        transition={400}
                    />
                    <View className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    {/* Price */}
                    <View
                        className="absolute top-3 right-3 px-3 py-1.5 rounded-lg"
                        style={{ backgroundColor: isPaid ? COLORS.primary : COLORS.success }}
                    >
                        <Text className="text-white text-xs font-bold">
                            {isPaid ? `${(event.price ?? 0).toLocaleString()}₫` : 'FREE'}
                        </Text>
                    </View>

                    {/* Content */}
                    <View className="absolute bottom-0 left-0 right-0 p-4">
                        <Text className="text-white font-bold text-lg mb-2" numberOfLines={2}>
                            {event.title}
                        </Text>
                        <View className="flex-row items-center">
                            <Calendar size={12} color="#FFF" />
                            <Text className="text-white/80 text-xs ml-1.5">
                                {event.startTime
                                    ? new Date(event.startTime).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })
                                    : 'TBD'}
                            </Text>
                            <View className="w-1 h-1 bg-white/50 rounded-full mx-2" />
                            <Text className="text-white/80 text-xs" numberOfLines={1}>
                                {event.club?.name}
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const FilterChip = ({ label, value, icon: Icon, count }: { label: string; value: string; icon?: any; count?: number }) => (
        <TouchableOpacity
            onPress={() => setFilter(value)}
            className={`px-4 py-2.5 rounded-xl mr-2 flex-row items-center ${filter === value
                ? 'bg-primary'
                : 'bg-card border border-border'
                }`}
            style={filter === value ? {
                shadowColor: COLORS.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            } : {}}
        >
            {Icon && <Icon size={14} color={filter === value ? '#FFF' : COLORS.textSecondary} style={{ marginRight: 6 }} />}
            <Text className={`font-semibold text-sm ${filter === value ? 'text-white' : 'text-text-secondary'}`}>
                {label}
            </Text>
            {count !== undefined && (
                <View
                    className="ml-2 px-1.5 py-0.5 rounded-md"
                    style={{ backgroundColor: filter === value ? 'rgba(255,255,255,0.25)' : COLORS.border }}
                >
                    <Text className={`text-xs font-bold ${filter === value ? 'text-white' : 'text-text-secondary'}`}>
                        {count}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );

    const trendingEvents = events.slice(0, 4);
    const upcomingEvents = events.slice(1);

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 120 }}
                >
                    {/* Header - Modern Design */}
                    <View className="px-5 pt-3 pb-5">
                        <View className="flex-row justify-between items-center mb-5">
                            <View className="flex-1">
                                <Text className="text-text-secondary text-sm font-medium">Welcome back 👋</Text>
                                <Text className="text-text text-2xl font-bold mt-0.5">{user?.fullName || 'Student'}</Text>
                            </View>
                            <TouchableOpacity
                                className="w-12 h-12 bg-card border border-border rounded-full items-center justify-center mr-3"
                                style={{
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.05,
                                    shadowRadius: 4,
                                }}
                            >
                                <Bell size={20} color={COLORS.text} />
                                {/* Notification dot */}
                                <View className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-background" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="w-12 h-12 rounded-full items-center justify-center overflow-hidden"
                                onPress={() => router.push('/(student)/profile')}
                                style={{
                                    backgroundColor: COLORS.primary,
                                    shadowColor: COLORS.primary,
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.4,
                                    shadowRadius: 8,
                                }}
                            >
                                <Text className="text-white font-bold text-lg">
                                    {(user?.fullName || 'U').charAt(0).toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Search Bar - Premium */}
                        <View
                            className="flex-row items-center bg-card rounded-2xl px-4 h-14 border border-border"
                            style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.05,
                                shadowRadius: 8,
                            }}
                        >
                            <View className="w-10 h-10 bg-primary-soft rounded-xl items-center justify-center">
                                <Search size={18} color={COLORS.primary} />
                            </View>
                            <TextInput
                                placeholder="Search events, clubs..."
                                className="flex-1 ml-3 text-text text-base"
                                placeholderTextColor="#94A3B8"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                    </View>

                    {/* Quick Stats - Colorful Cards */}
                    <View className="flex-row px-5 mb-6">
                        <TouchableOpacity
                            className="flex-1 p-4 rounded-2xl mr-3 overflow-hidden"
                            style={{
                                backgroundColor: COLORS.secondary,
                                shadowColor: COLORS.secondary,
                                shadowOffset: { width: 0, height: 6 },
                                shadowOpacity: 0.35,
                                shadowRadius: 10,
                            }}
                            onPress={() => router.push('/(student)/clubs')}
                        >
                            <View className="flex-row items-center justify-between">
                                <View>
                                    <Text className="text-white/70 text-xs font-medium mb-1">Explore</Text>
                                    <Text className="text-white text-xl font-bold">Clubs</Text>
                                </View>
                                <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center">
                                    <Users size={22} color="#FFF" />
                                </View>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="flex-1 p-4 rounded-2xl overflow-hidden"
                            style={{
                                backgroundColor: COLORS.primary,
                                shadowColor: COLORS.primary,
                                shadowOffset: { width: 0, height: 6 },
                                shadowOpacity: 0.35,
                                shadowRadius: 10,
                            }}
                        >
                            <View className="flex-row items-center justify-between">
                                <View>
                                    <Text className="text-white/70 text-xs font-medium mb-1">Active</Text>
                                    <Text className="text-white text-xl font-bold">{events.length} Events</Text>
                                </View>
                                <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center">
                                    <Zap size={22} color="#FFF" />
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Featured Section */}
                    {events.length > 0 && (
                        <View className="px-5 mb-4">
                            <View className="flex-row justify-between items-center mb-4">
                                <View className="flex-row items-center">
                                    <Text className="text-2xl mr-2">🔥</Text>
                                    <Text className="text-text text-xl font-bold">Featured</Text>
                                </View>
                            </View>
                            <HeroEventCard event={events[0]} />
                        </View>
                    )}

                    {/* Trending Section */}
                    {trendingEvents.length > 1 && (
                        <View className="mb-6">
                            <View className="flex-row items-center px-5 mb-4">
                                <TrendingUp size={20} color={COLORS.primary} />
                                <Text className="text-text text-lg font-bold ml-2">Trending Now</Text>
                            </View>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingHorizontal: 20 }}
                            >
                                {trendingEvents.slice(1).map((event) => (
                                    <TrendingCard key={event.id} event={event} />
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Filter Chips */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="mb-5"
                        contentContainerStyle={{ paddingHorizontal: 20 }}
                    >
                        <FilterChip label="All" value="ALL" icon={Sparkles} count={events.length} />
                        <FilterChip label="Public" value="PUBLIC" />
                        <FilterChip label="My Clubs" value="MY_CLUBS" icon={Users} />
                    </ScrollView>

                    {/* Events List */}
                    <View className="px-5">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-text text-xl font-bold">Upcoming Events</Text>
                            <TouchableOpacity className="flex-row items-center">
                                <Text className="text-primary font-semibold text-sm mr-1">See All</Text>
                                <ChevronRight size={16} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>

                        {loading ? (
                            <View className="py-10">
                                <ActivityIndicator size="large" color={COLORS.primary} />
                            </View>
                        ) : upcomingEvents.length > 0 ? (
                            upcomingEvents.map((event, index) => (
                                <EventCard key={event.id} event={event} index={index} />
                            ))
                        ) : events.length === 0 ? (
                            <View className="items-center justify-center py-16 bg-card rounded-2xl border border-border">
                                <View className="w-20 h-20 bg-primary-soft rounded-full items-center justify-center mb-4">
                                    <Calendar size={36} color={COLORS.primary} />
                                </View>
                                <Text className="text-text font-bold text-lg">No events found</Text>
                                <Text className="text-text-secondary text-sm mt-1 text-center px-8">
                                    Check back later for new events or try a different filter
                                </Text>
                            </View>
                        ) : null}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
