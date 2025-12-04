import { useRouter } from 'expo-router';
import { ArrowRight, Search, Users } from 'lucide-react-native';
import { FlatList, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CLUBS } from '../../../constants/mockData';

export default function ClubList() {
    const router = useRouter();

    const renderItem = ({ item }) => (
        <TouchableOpacity
            className="bg-white rounded-2xl mb-4 shadow-sm shadow-gray-200 overflow-hidden border border-gray-100 flex-row"
            onPress={() => router.push(`/(student)/clubs/${item.id}`)}
        >
            <Image source={{ uri: item.image }} className="w-24 h-full" resizeMode="cover" />
            <View className="p-4 flex-1 justify-center">
                <View className="flex-row justify-between items-start">
                    <View className="flex-1 mr-2">
                        <Text className="text-xs font-bold text-primary mb-1 uppercase">{item.category}</Text>
                        <Text className="text-lg font-bold text-gray-900 mb-1" numberOfLines={1}>{item.name}</Text>
                    </View>
                    <ArrowRight size={20} color="#D1D5DB" />
                </View>

                <View className="flex-row items-center mt-2">
                    <Users size={14} color="#6B7280" />
                    <Text className="text-gray-500 text-sm ml-1">
                        {item.members} members
                    </Text>
                    <View className="w-1 h-1 bg-gray-300 rounded-full mx-2" />
                    <Text className="text-gray-400 text-sm">Est. {item.established}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50 p-4" edges={['top']}>
            <Text className="text-2xl font-bold text-gray-900 mb-6">Explore Clubs</Text>

            <View className="bg-white p-3 rounded-xl flex-row items-center mb-6 shadow-sm shadow-gray-100 border border-gray-100">
                <Search size={20} color="#9CA3AF" />
                <TextInput
                    placeholder="Search clubs..."
                    className="flex-1 ml-2 text-gray-700"
                    placeholderTextColor="#9CA3AF"
                />
            </View>

            <FlatList
                data={CLUBS}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </SafeAreaView>
    );
}
