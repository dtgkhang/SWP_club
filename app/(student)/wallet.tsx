import { Ticket } from 'lucide-react-native';
import { FlatList, Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TICKETS } from '../../constants/mockData';

export default function WalletScreen() {
    const renderItem = ({ item }) => (
        <View className="bg-white rounded-2xl mb-4 shadow-sm shadow-gray-200 overflow-hidden border border-gray-100 mx-1">
            <View className="p-5 flex-row justify-between items-center bg-gray-900">
                <View className="flex-1 mr-4">
                    <Text className="text-white font-bold text-lg mb-1" numberOfLines={1}>{item.eventName}</Text>
                    <Text className="text-gray-400 text-xs">{new Date(item.date).toLocaleDateString()} • {item.location}</Text>
                </View>
                <View className={`px-2 py-1 rounded-md ${item.status === 'VALID' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    <Text className={`text-xs font-bold ${item.status === 'VALID' ? 'text-green-400' : 'text-red-400'}`}>
                        {item.status}
                    </Text>
                </View>
            </View>

            <View className="p-6 items-center justify-center bg-white border-t border-dashed border-gray-200 relative">
                <View className="absolute -left-3 top-[-10] w-6 h-6 rounded-full bg-gray-50" />
                <View className="absolute -right-3 top-[-10] w-6 h-6 rounded-full bg-gray-50" />

                <Image
                    source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${item.qrCode}` }}
                    className="w-40 h-40"
                />
                <Text className="text-gray-400 text-xs mt-4 text-center">Scan this code at the entrance</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50 p-4" edges={['top']}>
            <Text className="text-2xl font-bold text-gray-900 mb-6">My Wallet</Text>

            <FlatList
                data={TICKETS}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={
                    <View className="items-center justify-center mt-20">
                        <Ticket size={64} color="#D1D5DB" />
                        <Text className="text-gray-400 mt-4">No tickets yet</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}
