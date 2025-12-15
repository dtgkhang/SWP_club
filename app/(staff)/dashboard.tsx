import { useRouter } from 'expo-router';
import { Calendar, DollarSign, FileText, RefreshCw, ScanLine, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { authService } from '../../services/auth.service';
import api from '../../services/api';

interface Event {
    id: string;
    title: string;
    startTime?: string;
    location?: string;
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
    const [clubName, setClubName] = useState<string>('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load user profile
            const { user: profile } = await authService.getProfile();
            setUser(profile);

            // Get staff's club from memberships
            const staffMembership = profile?.memberships?.find(
                (m: any) => m.status === 'ACTIVE' && ['STAFF', 'LEADER', 'TREASURER'].includes(m.role)
            );

            if (staffMembership?.club) {
                setClubName(staffMembership.club.name || '');

                // Load events from staff's club
                const response = await api<{ success: boolean; data: Event[] }>(
                    `/events?clubId=${staffMembership.clubId}`
                );
                setEvents(response.data || []);
            }
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

    const getTodayEvents = () => {
        const today = new Date().toDateString();
        return events.filter(e =>
            e.startTime && new Date(e.startTime).toDateString() === today
        );
    };

    const getUpcomingEvents = () => {
        const now = new Date();
        return events
            .filter(e => e.startTime && new Date(e.startTime) > now)
            .slice(0, 5);
    };

    const todayEvents = getTodayEvents();
    const upcomingEvents = getUpcomingEvents();

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <FlatList
                data={upcomingEvents}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
                ListHeaderComponent={() => (
                    <View className="p-4">
                        {/* Header */}
                        <View className="flex-row justify-between items-center mb-6">
                            <View>
                                <Text className="text-gray-500 text-sm">Staff Portal</Text>
                                <Text className="text-2xl font-bold text-gray-900">Dashboard</Text>
                                {clubName && (
                                    <Text className="text-primary text-sm font-medium">{clubName}</Text>
                                )}
                            </View>
                            {/* Exit Staff Mode Button */}
                            <TouchableOpacity
                                className="bg-gray-100 px-4 py-2.5 rounded-xl flex-row items-center"
                                onPress={() => router.replace('/(student)/profile')}
                            >
                                <Text className="text-gray-600 font-medium text-sm">Exit</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Quick Actions */}
                        <View className="flex-row mb-6">
                            <TouchableOpacity
                                className="flex-1 bg-white p-4 rounded-2xl mr-2 shadow-sm shadow-gray-200 items-center justify-center h-28"
                                onPress={() => router.push('/(staff)/scanner')}
                            >
                                <View className="w-12 h-12 bg-indigo-100 rounded-full items-center justify-center mb-2">
                                    <ScanLine size={24} color="#4F46E5" />
                                </View>
                                <Text className="font-bold text-gray-800">Check-in</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className="flex-1 bg-white p-4 rounded-2xl ml-2 shadow-sm shadow-gray-200 items-center justify-center h-28"
                                onPress={() => router.push('/(staff)/fund-request')}
                            >
                                <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mb-2">
                                    <FileText size={24} color="#10B981" />
                                </View>
                                <Text className="font-bold text-gray-800">Fund Request</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Today's Stats */}
                        <View className="bg-white p-4 rounded-2xl mb-6 shadow-sm shadow-gray-200">
                            <Text className="font-bold text-gray-800 mb-4">Today's Overview</Text>
                            <View className="flex-row">
                                <View className="flex-1 items-center">
                                    <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mb-2">
                                        <Calendar size={20} color="#2563EB" />
                                    </View>
                                    <Text className="text-2xl font-bold text-gray-900">{todayEvents.length}</Text>
                                    <Text className="text-xs text-gray-500">Events Today</Text>
                                </View>
                                <View className="flex-1 items-center">
                                    <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mb-2">
                                        <Users size={20} color="#7C3AED" />
                                    </View>
                                    <Text className="text-2xl font-bold text-gray-900">{events.length}</Text>
                                    <Text className="text-xs text-gray-500">Total Events</Text>
                                </View>
                            </View>
                        </View>

                        {/* Upcoming Events Header */}
                        {upcomingEvents.length > 0 && (
                            <Text className="font-bold text-gray-800 mb-3">Upcoming Events</Text>
                        )}
                    </View>
                )}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        className="mx-4 mb-3 bg-white p-4 rounded-xl shadow-sm shadow-gray-200"
                        onPress={() => router.push({ pathname: '/(staff)/scanner', params: { eventId: item.id } })}
                    >
                        <View className="flex-row items-center">
                            <View className="w-12 h-12 bg-primary-soft rounded-xl items-center justify-center mr-3">
                                <Calendar size={22} color={COLORS.primary} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-900 font-bold" numberOfLines={1}>{item.title}</Text>
                                <Text className="text-gray-500 text-xs">
                                    {item.startTime
                                        ? new Date(item.startTime).toLocaleDateString('vi-VN', {
                                            day: 'numeric',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })
                                        : 'TBA'
                                    }
                                </Text>
                            </View>
                            <View className="bg-gray-100 px-3 py-1 rounded-full">
                                <Text className="text-xs text-gray-600">{item._count?.tickets || 0} tickets</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                    <View className="mx-4 bg-white p-6 rounded-2xl items-center">
                        <Calendar size={40} color={COLORS.textLight} />
                        <Text className="text-gray-500 mt-3 text-center">No upcoming events</Text>
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 40 }}
            />
        </SafeAreaView>
    );
}
