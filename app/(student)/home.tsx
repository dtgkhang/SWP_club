import { useRouter } from 'expo-router';
import { Calendar, MapPin, Search } from 'lucide-react-native';
import { FlatList, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EVENTS } from '../../constants/mockData';

export default function StudentHome() {
    const router = useRouter();

    const renderItem = ({ item }) => (
        <TouchableOpacity
            className="bg-white rounded-2xl mb-4 shadow-sm shadow-gray-200 overflow-hidden border border-gray-100"
            onPress={() => router.push(`/(student)/events/${item.id}`)}
        >
            <Image source={{ uri: item.image }} className="w-full h-40" resizeMode="cover" />
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
                    <Text className="text-2xl font-bold text-gray-900">Student</Text>
                </View>
                <View className="w-10 h-10 bg-gray-200 rounded-full items-center justify-center border border-gray-300">
                    <Text className="font-bold text-gray-600">S</Text>
                </View>
            </View>

            <View className="bg-white p-3 rounded-xl flex-row items-center mb-6 shadow-sm shadow-gray-100 border border-gray-100">
                <Search size={20} color="#9CA3AF" />
                <TextInput
                    placeholder="Search events..."
                    className="flex-1 ml-2 text-gray-700"
                    placeholderTextColor="#9CA3AF"
                />
            </View>

            <Text className="text-lg font-bold text-gray-900 mb-4">Upcoming Events</Text>

            <FlatList
                data={EVENTS}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </SafeAreaView>
    );
}
