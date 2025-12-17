import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ArrowRight, Calendar, CheckCircle, Clock, FileText, MapPin, QrCode, ScanLine, Ticket, TrendingUp, Users, Video } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { authService } from '../../services/auth.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Event {
    id: string;
    title: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    format?: string;
    pricingType?: string;
    price?: number;
    capacity?: number;
    club?: {
        id: string;
        name: string;
        logoUrl?: string;
    };
    _count?: {
        tickets?: number;
    };
}

export default function StaffDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [{ user: profile }, staffEvents] = await Promise.all([
                authService.getProfile(),
                authService.getMyStaffEvents()
            ]);
            setUser(profile);
            setEvents(staffEvents);
        } catch (error) {
            console.log('Error loading data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const now = new Date();
    const todayEvents = events.filter(e =>
        e.startTime && new Date(e.startTime).toDateString() === now.toDateString()
    );
    const upcomingEvents = events.filter(e =>
        e.startTime && new Date(e.startTime) > now
    ).sort((a, b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime());

    const totalTickets = events.reduce((sum, e) => sum + (e._count?.tickets || 0), 0);
    const uniqueClubs = [...new Set(events.map(e => e.club?.name).filter(Boolean))];

    const formatEventTime = (startTime?: string, endTime?: string) => {
        if (!startTime) return 'TBA';
        const start = new Date(startTime);
        const dateStr = start.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
        const timeStr = start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        return `${dateStr} • ${timeStr}`;
    };

    const getEventStatus = (event: Event) => {
        if (!event.startTime) return { label: 'TBA', color: COLORS.textSecondary };
        const start = new Date(event.startTime);
        const end = event.endTime ? new Date(event.endTime) : null;

        if (end && now > end) return { label: 'Ended', color: COLORS.error };
        if (now >= start && (!end || now <= end)) return { label: 'Live Now', color: COLORS.success };

        const hoursUntil = (start.getTime() - now.getTime()) / 3600000;
        if (hoursUntil < 24) return { label: 'Today', color: COLORS.warning };
        if (hoursUntil < 168) return { label: 'This Week', color: COLORS.secondary };
        return { label: 'Upcoming', color: COLORS.primary };
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-background justify-center items-center">
                <ActivityIndicator size="large" color={COLORS.success} />
                <Text className="text-text-secondary mt-4">Loading your events...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.success} />}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                {/* Header */}
                <View className="px-5 pt-3 pb-4">
                    <View className="flex-row justify-between items-center">
                        <View className="flex-1">
                            <Text className="text-text-secondary text-sm">Staff Portal</Text>
                            <Text className="text-text text-2xl font-bold">Dashboard</Text>
                            {uniqueClubs.length > 0 && (
                                <Text className="text-success text-sm font-medium mt-0.5">
                                    {uniqueClubs.length === 1 ? uniqueClubs[0] : `${uniqueClubs.length} clubs`}
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity
                            className="bg-card border border-border px-4 py-2.5 rounded-xl flex-row items-center"
                            onPress={() => router.replace('/(student)/profile')}
                            style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.05,
                                shadowRadius: 4,
                            }}
                        >
                            <Text className="text-text-secondary font-semibold text-sm">Exit</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Quick Stats */}
                <View className="px-5 mb-6">
                    <View className="flex-row">
                        <View
                            className="flex-1 bg-success p-4 rounded-2xl mr-2"
                            style={{
                                shadowColor: COLORS.success,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                            }}
                        >
                            <View className="flex-row items-center mb-2">
                                <View className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center mr-3">
                                    <Calendar size={20} color="#FFF" />
                                </View>
                                <Text className="text-white/80 text-sm font-medium">My Events</Text>
                            </View>
                            <Text className="text-white text-3xl font-bold">{events.length}</Text>
                        </View>
                        <View
                            className="flex-1 bg-primary p-4 rounded-2xl ml-2"
                            style={{
                                shadowColor: COLORS.primary,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                            }}
                        >
                            <View className="flex-row items-center mb-2">
                                <View className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center mr-3">
                                    <Ticket size={20} color="#FFF" />
                                </View>
                                <Text className="text-white/80 text-sm font-medium">Tickets</Text>
                            </View>
                            <Text className="text-white text-3xl font-bold">{totalTickets}</Text>
                        </View>
                    </View>
                </View>

                {/* Quick Actions */}
                <View className="px-5 mb-6">
                    <Text className="text-text font-bold text-lg mb-3">Quick Actions</Text>
                    <View className="flex-row">
                        <TouchableOpacity
                            className="flex-1 bg-card border border-border p-5 rounded-2xl mr-2 items-center"
                            onPress={() => router.push('/(staff)/scanner')}
                            style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.08,
                                shadowRadius: 12,
                            }}
                        >
                            <View
                                className="w-14 h-14 bg-success rounded-2xl items-center justify-center mb-3"
                                style={{
                                    shadowColor: COLORS.success,
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 8,
                                }}
                            >
                                <ScanLine size={28} color="#FFF" />
                            </View>
                            <Text className="text-text font-bold text-base">Check-in</Text>
                            <Text className="text-text-secondary text-xs mt-1">Scan QR codes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="flex-1 bg-card border border-border p-5 rounded-2xl ml-2 items-center"
                            onPress={() => router.push('/(staff)/event-detail')}
                            style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.08,
                                shadowRadius: 12,
                            }}
                        >
                            <View
                                className="w-14 h-14 bg-secondary rounded-2xl items-center justify-center mb-3"
                                style={{
                                    shadowColor: COLORS.secondary,
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 8,
                                }}
                            >
                                <Users size={28} color="#FFF" />
                            </View>
                            <Text className="text-text font-bold text-base">Attendees</Text>
                            <Text className="text-text-secondary text-xs mt-1">View list</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Today's Events */}
                {todayEvents.length > 0 && (
                    <View className="mb-6">
                        <View className="flex-row items-center px-5 mb-3">
                            <View className="w-3 h-3 bg-success rounded-full mr-2" />
                            <Text className="text-text font-bold text-lg">Today's Events</Text>
                            <View className="bg-success-soft px-2.5 py-1 rounded-full ml-2">
                                <Text className="text-success text-xs font-bold">{todayEvents.length}</Text>
                            </View>
                        </View>
                        {todayEvents.map(event => (
                            <TouchableOpacity
                                key={event.id}
                                className="mx-5 mb-3 bg-success/10 border border-success/30 p-4 rounded-2xl"
                                onPress={() => router.push({ pathname: '/(staff)/scanner', params: { eventId: event.id } })}
                            >
                                <View className="flex-row items-center">
                                    <View className="w-14 h-14 bg-success rounded-xl items-center justify-center mr-4">
                                        <QrCode size={24} color="#FFF" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-text font-bold text-base" numberOfLines={1}>{event.title}</Text>
                                        <View className="flex-row items-center mt-1">
                                            <Clock size={12} color={COLORS.success} />
                                            <Text className="text-success text-sm ml-1 font-medium">
                                                {event.startTime ? new Date(event.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'TBA'}
                                            </Text>
                                            {event.location && (
                                                <>
                                                    <Text className="text-text-secondary mx-2">•</Text>
                                                    <MapPin size={12} color={COLORS.textSecondary} />
                                                    <Text className="text-text-secondary text-sm ml-1" numberOfLines={1}>{event.location}</Text>
                                                </>
                                            )}
                                        </View>
                                    </View>
                                    <View className="bg-success px-3 py-1.5 rounded-lg">
                                        <Text className="text-white text-xs font-bold">{event._count?.tickets || 0}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* All Events */}
                <View className="px-5">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-text font-bold text-lg">All My Events</Text>
                        <View className="bg-primary-soft px-3 py-1 rounded-full">
                            <Text className="text-primary text-sm font-bold">{events.length}</Text>
                        </View>
                    </View>

                    {events.length === 0 ? (
                        <View className="bg-card border border-border rounded-2xl p-8 items-center">
                            <View className="w-20 h-20 bg-primary-soft rounded-full items-center justify-center mb-4">
                                <Calendar size={40} color={COLORS.primary} />
                            </View>
                            <Text className="text-text font-bold text-lg mb-2">No Events Assigned</Text>
                            <Text className="text-text-secondary text-center">
                                You haven't been assigned as staff to any events yet.
                            </Text>
                        </View>
                    ) : (
                        events.map(event => {
                            const status = getEventStatus(event);
                            const isOnline = event.format === 'ONLINE';
                            const isPaid = event.pricingType === 'PAID';

                            return (
                                <TouchableOpacity
                                    key={event.id}
                                    className="bg-card border border-border rounded-2xl mb-3 overflow-hidden"
                                    onPress={() => router.push({ pathname: '/(staff)/scanner', params: { eventId: event.id } })}
                                    style={{
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.05,
                                        shadowRadius: 8,
                                    }}
                                >
                                    <View className="p-4">
                                        {/* Header Row */}
                                        <View className="flex-row items-start mb-3">
                                            <View className="w-12 h-12 bg-primary-soft rounded-xl items-center justify-center mr-3">
                                                <Calendar size={22} color={COLORS.primary} />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-text font-bold text-base" numberOfLines={2}>{event.title}</Text>
                                                {event.club?.name && (
                                                    <Text className="text-text-secondary text-sm mt-0.5">{event.club.name}</Text>
                                                )}
                                            </View>
                                            <View
                                                className="px-2.5 py-1 rounded-lg"
                                                style={{ backgroundColor: status.color + '20' }}
                                            >
                                                <Text style={{ color: status.color }} className="text-xs font-bold">{status.label}</Text>
                                            </View>
                                        </View>

                                        {/* Info Row */}
                                        <View className="flex-row flex-wrap mb-3">
                                            <View className="flex-row items-center mr-4 mb-1">
                                                <Clock size={14} color={COLORS.textSecondary} />
                                                <Text className="text-text-secondary text-sm ml-1.5">
                                                    {formatEventTime(event.startTime)}
                                                </Text>
                                            </View>
                                            {event.location && (
                                                <View className="flex-row items-center mr-4 mb-1">
                                                    <MapPin size={14} color={COLORS.textSecondary} />
                                                    <Text className="text-text-secondary text-sm ml-1.5" numberOfLines={1}>
                                                        {isOnline ? 'Online' : event.location}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>

                                        {/* Stats Row */}
                                        <View className="flex-row items-center justify-between pt-3 border-t border-border">
                                            <View className="flex-row">
                                                <View className="flex-row items-center bg-success-soft px-3 py-1.5 rounded-lg mr-2">
                                                    <Ticket size={14} color={COLORS.success} />
                                                    <Text className="text-success text-sm font-bold ml-1.5">{event._count?.tickets || 0}</Text>
                                                </View>
                                                {isPaid && (
                                                    <View className="flex-row items-center bg-primary-soft px-3 py-1.5 rounded-lg">
                                                        <Text className="text-primary text-sm font-bold">{(event.price || 0).toLocaleString()}₫</Text>
                                                    </View>
                                                )}
                                                {!isPaid && (
                                                    <View className="flex-row items-center bg-secondary-soft px-3 py-1.5 rounded-lg">
                                                        <Text className="text-secondary text-sm font-bold">FREE</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <View className="flex-row items-center">
                                                <Text className="text-primary font-semibold text-sm mr-1">Check-in</Text>
                                                <ArrowRight size={16} color={COLORS.primary} />
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
