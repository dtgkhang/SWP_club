import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Clock, MapPin } from 'lucide-react-native';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EVENTS } from '../../../constants/mockData';

export default function EventDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const event = EVENTS.find(e => e.id === id);

    if (!event) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center">
                <Text>Event not found</Text>
            </SafeAreaView>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <Image source={{ uri: event.image }} className="w-full h-72" resizeMode="cover" />

            <SafeAreaView className="absolute top-0 left-0 w-full p-4">
                <TouchableOpacity
                    className="w-10 h-10 bg-white/80 rounded-full items-center justify-center backdrop-blur-md"
                    onPress={() => router.back()}
                >
                    <ArrowLeft size={24} color="#000" />
                </TouchableOpacity>
            </SafeAreaView>

            <ScrollView className="flex-1 -mt-6 bg-white rounded-t-3xl px-6 pt-8">
                <Text className="text-2xl font-bold text-gray-900 mb-2">{event.title}</Text>

                <View className="flex-row items-center mb-6">
                    <View className="bg-indigo-50 px-3 py-1 rounded-full">
                        <Text className="text-primary font-bold text-sm">
                            {event.price === 0 ? 'Free Entry' : `${event.price.toLocaleString()} VND`}
                        </Text>
                    </View>
                </View>

                <View className="space-y-4 mb-8">
                    <View className="flex-row items-center">
                        <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-4">
                            <Calendar size={20} color="#4F46E5" />
                        </View>
                        <View>
                            <Text className="text-gray-500 text-sm">Date</Text>
                            <Text className="text-gray-900 font-medium">
                                {new Date(event.date).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>

                    <View className="flex-row items-center">
                        <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-4">
                            <Clock size={20} color="#4F46E5" />
                        </View>
                        <View>
                            <Text className="text-gray-500 text-sm">Time</Text>
                            <Text className="text-gray-900 font-medium">
                                {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    </View>

                    <View className="flex-row items-center">
                        <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-4">
                            <MapPin size={20} color="#4F46E5" />
                        </View>
                        <View>
                            <Text className="text-gray-500 text-sm">Location</Text>
                            <Text className="text-gray-900 font-medium">{event.location}</Text>
                        </View>
                    </View>
                </View>

                <Text className="text-lg font-bold text-gray-900 mb-2">About Event</Text>
                <Text className="text-gray-600 leading-6 mb-24">{event.description}</Text>
            </ScrollView>

            <View className="absolute bottom-0 w-full p-6 bg-white border-t border-gray-100 shadow-lg">
                <TouchableOpacity
                    className="w-full bg-primary py-4 rounded-xl items-center shadow-md shadow-indigo-200"
                    onPress={() => router.push({ pathname: '/(student)/payment', params: { eventId: event.id, amount: event.price } })}
                >
                    <Text className="text-white font-bold text-lg">
                        {event.price === 0 ? 'Register Now' : 'Buy Ticket'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
