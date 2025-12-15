import { Ticket } from 'lucide-react-native';
import { FlatList, Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { TICKETS } from '../../constants/mockData';

export default function WalletScreen() {
    const renderItem = ({ item }: { item: any }) => (
        <View className="bg-card rounded-2xl mb-4 overflow-hidden border border-border mx-1">
            {/* Ticket Header */}
            <View className="p-4 flex-row justify-between items-center bg-text">
                <View className="flex-1 mr-4">
                    <Text className="text-white font-bold text-base mb-1" numberOfLines={1}>
                        {item.eventName}
                    </Text>
                    <Text className="text-white/60 text-xs">
                        {new Date(item.date).toLocaleDateString('vi-VN', {
                            weekday: 'short', day: 'numeric', month: 'short'
                        })} • {item.location}
                    </Text>
                </View>
                <View className={`px-2.5 py-1 rounded-lg ${item.status === 'VALID' ? 'bg-success/20' : 'bg-danger/20'
                    }`}>
                    <Text className={`text-xs font-bold ${item.status === 'VALID' ? 'text-success' : 'text-danger'
                        }`}>
                        {item.status}
                    </Text>
                </View>
            </View>

            {/* QR Code Section */}
            <View className="p-6 items-center justify-center bg-card relative">
                {/* Decorative cutouts */}
                <View className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-background" />
                <View className="absolute -right-3 top-0 w-6 h-6 rounded-full bg-background" />

                {/* Dashed line */}
                <View className="absolute top-0 left-6 right-6 border-t border-dashed border-border" />

                <Image
                    source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${item.qrCode}` }}
                    className="w-36 h-36 rounded-lg"
                />
                <Text className="text-text-secondary text-xs mt-4 text-center">
                    Show this QR code at the entrance
                </Text>
                <Text className="text-text font-mono text-xs mt-1 bg-background px-3 py-1 rounded">
                    {item.qrCode}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            {/* Header */}
            <View className="px-5 pt-2 pb-4">
                <Text className="text-text text-2xl font-bold mb-1">My Tickets</Text>
                <Text className="text-text-secondary text-sm">Your event tickets and passes</Text>
            </View>

            {/* Stats */}
            <View className="flex-row px-5 mb-4">
                <View className="bg-primary-soft px-4 py-2 rounded-xl mr-2">
                    <Text className="text-primary font-bold">{TICKETS.length} Active</Text>
                </View>
            </View>

            {/* Tickets List */}
            <View className="flex-1 px-4">
                <FlatList
                    data={TICKETS}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20">
                            <View className="bg-border/30 w-20 h-20 rounded-full items-center justify-center mb-4">
                                <Ticket size={40} color={COLORS.textLight} />
                            </View>
                            <Text className="text-text font-bold text-lg">No tickets yet</Text>
                            <Text className="text-text-secondary text-sm mt-1">
                                Register for events to get your tickets here
                            </Text>
                        </View>
                    }
                />
            </View>
        </SafeAreaView>
    );
}
