
import { useRouter } from 'expo-router';
import { Bell, Calendar, ChevronRight, Clock, MapPin, Search, Sparkles, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { authService } from '../../services/auth.service';
import { Event, eventService } from '../../services/event.service';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

export default function StudentHome() {
    const router = useRouter();
    const [filter, setFilter] = useState('ALL');
    const [user, setUser] = useState<any>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        loadEvents();
    }, [filter]);

    const loadData = async () => {
        await Promise.all([loadProfile(), loadEvents()]);
    };

    const loadProfile = async () => {
        try {
            const { user: profile } = await authService.getProfile();
            setUser(profile);
        } catch (error) {
            console.log('Error fetching profile:', error);
        }
    };

    const loadEvents = async () => {
        try {
            setLoading(true);
            const typeFilter = filter === 'ALL' ? undefined : filter;
            const data = await eventService.getAllEvents({ type: typeFilter });
            setEvents(data);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEvents = events.filter(e =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                    className="w-full h-52"
                    resizeMode="cover"
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

    // Regular Event Card
    const EventCard = ({ event }: { event: Event }) => (
        <TouchableOpacity
            className="bg-card rounded-2xl mb-4 overflow-hidden border border-border flex-row"
            onPress={() => router.push(`/(student)/events/${event.id}`)}
            activeOpacity={0.7}
            style={{ height: 120 }}
        >
            <Image
                source={{ uri: event.club?.logoUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300' }}
                className="w-28 h-full"
                resizeMode="cover"
            />
            <View className="flex-1 p-4 justify-between">
                <View>
                    <View className="flex-row items-center mb-1">
                        <View className={`px-2 py-0.5 rounded ${event.pricingType === 'FREE' ? 'bg-success-soft' : 'bg-primary-soft'}`}>
                            <Text className={`text-xs font-bold ${event.pricingType === 'FREE' ? 'text-success' : 'text-primary'}`}>
                                {event.pricingType === 'FREE' ? 'FREE' : `${(event.price ?? 0).toLocaleString()}₫`}
                            </Text>
                        </View>
                    </View>
                    <Text className="text-text font-bold text-base" numberOfLines={1}>{event.title}</Text>
                </View>
                <View>
                    <View className="flex-row items-center">
                        <Clock size={12} color={COLORS.textSecondary} />
                        <Text className="text-text-secondary text-xs ml-1">
                            {event.startTime
                                ? new Date(event.startTime).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })
                                : 'TBD'}
                        </Text>
                        <View className="w-1 h-1 bg-border rounded-full mx-2" />
                        <Text className="text-secondary text-xs font-medium">{event.club?.name}</Text>
                    </View>
                </View>
            </View>
            <View className="justify-center pr-3">
                <ChevronRight size={18} color={COLORS.border} />
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
                {filteredEvents.length > 0 && (
                    <View className="px-5 mb-2">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-text text-lg font-bold">🔥 Featured Event</Text>
                        </View>
                        <FeaturedEventCard event={filteredEvents[0]} />
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
                    <FilterChip label="My Clubs" value="INTERNAL" />
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
                    ) : filteredEvents.length > 1 ? (
                        filteredEvents.slice(1).map(event => (
                            <EventCard key={event.id} event={event} />
                        ))
                    ) : filteredEvents.length === 0 ? (
                        <View className="items-center justify-center py-16">
                            <Text className="text-6xl mb-4">📭</Text>
                            <Text className="text-text font-bold text-lg">No events found</Text>
                            <Text className="text-text-secondary text-sm mt-1">Check back later for new events</Text>
                        </View>
                    ) : null}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
