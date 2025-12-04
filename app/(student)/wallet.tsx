import { Ticket } from 'lucide-react-native';
import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TICKETS } from '../../constants/mockData';

export default function WalletScreen() {
    const renderItem = ({ item }) => (
        <View className="bg-white rounded-2xl mb-4 shadow-sm shadow-gray-200 overflow-hidden border border-gray-100">
            <View className="bg-primary p-4">
                <Text className="text-white font-bold text-lg">{item.eventName}</Text>
                <Text className="text-indigo-100 text-sm">{item.studentName}</Text>
            </View>

            <View className="p-6 items-center bg-white relative">
                {/* Ticket Cutout Effect */}
                <View className="absolute -left-3 top-1/2 w-6 h-6 bg-gray-50 rounded-full" />
                <View className="absolute -right-3 top-1/2 w-6 h-6 bg-gray-50 rounded-full" />

                <View className="w-48 h-48 bg-gray-100 mb-4 items-center justify-center rounded-lg border-2 border-gray-200 border-dashed">
                    <Text className="text-gray-400 font-bold">{item.qrCode}</Text>
                </View>
                <Text className="text-gray-500 text-sm mb-1">Show this code at check-in</Text>
                <View className="bg-green-100 px-3 py-1 rounded-full mt-2">
                    <Text className="text-green-700 font-bold text-xs">{item.status}</Text>
                </View>
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
