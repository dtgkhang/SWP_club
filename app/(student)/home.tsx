import { useRouter } from 'expo-router';
import { Calendar, Lock, MapPin, Search } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { FlatList, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CURRENT_USER, EVENTS } from '../../constants/mockData';
import { authService, User } from '../../services/auth.service';

export default function StudentHome() {
    const router = useRouter();
    const [filter, setFilter] = useState('ALL'); // ALL, PUBLIC, INTERNAL
    // combined type for mock and real user
    const [user, setUser] = useState<any>(CURRENT_USER);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const { user: profile } = await authService.getProfile();
            if (profile) {
                // Merge profile, prioritizing profile.fullName over mock name
                setUser((prev: any) => ({ ...prev, ...profile, name: profile.fullName || prev.name }));
            }
        } catch (error) {
            console.log('Error fetching profile:', error);
        }
    };

    // Filter events
    const visibleEvents = EVENTS.filter(event => {
        const clubId = event.clubId || '';
        // Mock logic: check mock memberships
        const userMemberships = (CURRENT_USER as any).memberships || [];

        if (filter === 'PUBLIC') return event.type === 'PUBLIC';
        if (filter === 'INTERNAL') return event.type === 'INTERNAL' && clubId && userMemberships.includes(clubId);
        return event.type === 'PUBLIC' || (event.type === 'INTERNAL' && clubId && userMemberships.includes(clubId));
    });

    const renderItem = ({ item }: { item: typeof EVENTS[0] }) => (
        <TouchableOpacity
            className="bg-white rounded-2xl mb-4 shadow-sm shadow-gray-200 overflow-hidden border border-gray-100"
            onPress={() => router.push(`/(student)/events/${item.id}`)}
        >
            <Image source={{ uri: item.image }} className="w-full h-40" resizeMode="cover" />
            {item.type === 'INTERNAL' && (
                <View className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded-lg flex-row items-center backdrop-blur-sm">
                    <Lock size={12} color="#FFF" />
                    <Text className="text-white text-xs font-bold ml-1">Members Only</Text>
                </View>
            )}
            <View className="p-4">
                <Text className="text-lg font-bold text-gray-900 mb-1">{item.title}</Text>
                <View className="flex-row items-center mb-1">
                    <Calendar size={14} color="#6B7280" />
                    <Text className="text-gray-500 text-sm ml-1">
                        {new Date(item.date).toLocaleDateString()}
                    </Text>
                </View>
                <View className="flex-row items-center justify-between mt-2">
                    <View className="flex-row items-center">
                        <MapPin size={14} color="#6B7280" />
                        <Text className="text-gray-500 text-sm ml-1">{item.location}</Text>
                    </View>
                    <Text className="text-primary font-bold">
                        {item.price === 0 ? 'Free' : `${item.price.toLocaleString()} VND`}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50 p-4" edges={['top']}>
            <View className="flex-row justify-between items-center mb-6">
                <View>
                    <Text className="text-gray-500 text-sm">Welcome back,</Text>
                    <Text className="text-2xl font-bold text-gray-900">{user.name || user.fullName}</Text>
                </View>
                <View className="w-10 h-10 bg-gray-200 rounded-full items-center justify-center border border-gray-300">
                    <Text className="font-bold text-gray-600">S</Text>
                </View>
            </View>

            <View className="bg-white p-3 rounded-xl flex-row items-center mb-4 shadow-sm shadow-gray-100 border border-gray-100">
                <Search size={20} color="#9CA3AF" />
                <TextInput
                    placeholder="Search events..."
                    className="flex-1 ml-2 text-gray-700"
                    placeholderTextColor="#9CA3AF"
                />
            </View>

            <View className="flex-row mb-6">
                {['ALL', 'PUBLIC', 'INTERNAL'].map((f) => (
                    <TouchableOpacity
                        key={f}
                        onPress={() => setFilter(f)}
                        className={`px-4 py-2 rounded-full mr-2 border ${filter === f ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
                    >
                        <Text className={`font-bold text-xs ${filter === f ? 'text-white' : 'text-gray-500'}`}>
                            {f === 'ALL' ? 'All Events' : f === 'PUBLIC' ? 'Public' : 'My Club'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text className="text-lg font-bold text-gray-900 mb-4">Upcoming Events</Text>

            <FlatList
                data={visibleEvents}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </SafeAreaView>
    );
}
