import { Calendar, CheckCircle, MapPin, Ticket, XCircle } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { FlatList, Image, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { useToast } from '../../contexts/ToastContext';
import { eventService } from '../../services/event.service';

type TabType = 'ALL' | 'ACTIVE' | 'USED' | 'EXPIRED';

export default function WalletScreen() {
    const { showError } = useToast();
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('ALL');

    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        try {
            setLoading(true);
            const data = await eventService.getMyTickets();
            setTickets(data);
        } catch (error) {
            console.log('Error loading tickets:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadTickets();
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'PAID':
            case 'INIT':
            case 'RESERVED':
                return { label: 'Active', color: COLORS.success, bgColor: 'bg-success', category: 'ACTIVE' };
            case 'USED':
                return { label: 'Used', color: COLORS.secondary, bgColor: 'bg-secondary', category: 'USED' };
            case 'EXPIRED':
                return { label: 'Expired', color: COLORS.textLight, bgColor: 'bg-border', category: 'EXPIRED' };
            case 'CANCELLED':
                return { label: 'Cancelled', color: COLORS.error, bgColor: 'bg-danger', category: 'EXPIRED' };
            default:
                return { label: 'Valid', color: COLORS.primary, bgColor: 'bg-primary', category: 'ACTIVE' };
        }
    };

    const filteredTickets = tickets.filter(ticket => {
        if (activeTab === 'ALL') return true;
        const info = getStatusInfo(ticket.status);
        return info.category === activeTab;
    });

    const counts = {
        all: tickets.length,
        active: tickets.filter(t => ['PAID', 'INIT', 'RESERVED'].includes(t.status)).length,
        used: tickets.filter(t => t.status === 'USED').length,
        expired: tickets.filter(t => ['EXPIRED', 'CANCELLED'].includes(t.status)).length,
    };

    const tabs: { key: TabType; label: string; count: number }[] = [
        { key: 'ALL', label: 'All', count: counts.all },
        { key: 'ACTIVE', label: 'Active', count: counts.active },
        { key: 'USED', label: 'Used', count: counts.used },
        { key: 'EXPIRED', label: 'Expired', count: counts.expired },
    ];

    const renderItem = ({ item }: { item: any }) => {
        const statusInfo = getStatusInfo(item.status);
        const isInactive = ['USED', 'EXPIRED', 'CANCELLED'].includes(item.status);

        return (
            <View className={`bg-card rounded-2xl mb-4 overflow-hidden border border-border mx-1 shadow-sm ${isInactive ? 'opacity-70' : ''}`}>
                {/* Ticket Header */}
                <View className={`p-4 flex-row justify-between items-center ${isInactive ? 'bg-text-secondary' : 'bg-primary'}`}>
                    <View className="flex-1 mr-4">
                        <Text className="text-white font-bold text-base mb-1" numberOfLines={1}>
                            {item.event?.title || 'Event Ticket'}
                        </Text>
                        <View className="flex-row items-center">
                            <Calendar size={12} color="rgba(255,255,255,0.8)" />
                            <Text className="text-white/80 text-xs ml-1">
                                {item.event?.startTime ? new Date(item.event.startTime).toLocaleDateString('vi-VN', {
                                    day: 'numeric', month: 'short'
                                }) : 'TBA'}
                            </Text>
                            <View className="w-1 h-1 bg-white/50 rounded-full mx-2" />
                            <MapPin size={12} color="rgba(255,255,255,0.8)" />
                            <Text className="text-white/80 text-xs ml-1" numberOfLines={1}>
                                {item.event?.location || 'Online'}
                            </Text>
                        </View>
                    </View>
                    <View className={`px-2.5 py-1 rounded-lg ${statusInfo.bgColor} flex-row items-center`}>
                        {item.status === 'USED' && <CheckCircle size={12} color="#FFF" />}
                        {['EXPIRED', 'CANCELLED'].includes(item.status) && <XCircle size={12} color="#FFF" />}
                        <Text className={`text-xs font-bold text-white uppercase ${item.status === 'USED' || ['EXPIRED', 'CANCELLED'].includes(item.status) ? 'ml-1' : ''}`}>
                            {statusInfo.label}
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

                    {item.qrCode && !isInactive ? (
                        <Image
                            source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${item.qrCode}` }}
                            className="w-36 h-36 rounded-lg"
                        />
                    ) : (
                        <View className={`w-36 h-36 rounded-lg items-center justify-center ${isInactive ? 'bg-border/50' : 'bg-gray-100'}`}>
                            <Ticket size={40} color={COLORS.textLight} />
                            <Text className="text-xs text-text-secondary mt-2">
                                {isInactive ? statusInfo.label : 'No QR Code'}
                            </Text>
                        </View>
                    )}

                    {!isInactive && item.qrCode && (
                        <>
                            <Text className="text-text-secondary text-xs mt-4 text-center">
                                Show this QR code at the entrance
                            </Text>
                            <Text className="text-text font-mono text-xs mt-1 bg-background px-3 py-1 rounded border border-border">
                                {item.qrCode}
                            </Text>
                        </>
                    )}

                    {item.status === 'USED' && item.usedAt && (
                        <View className="mt-4 flex-row items-center bg-secondary-soft px-3 py-2 rounded-lg">
                            <CheckCircle size={14} color={COLORS.secondary} />
                            <Text className="text-secondary text-xs font-medium ml-1">
                                Checked in: {new Date(item.usedAt).toLocaleString('vi-VN')}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            {/* Header */}
            <View className="px-5 pt-2 pb-4">
                <Text className="text-text text-2xl font-bold mb-1">My Tickets</Text>
                <Text className="text-text-secondary text-sm">Your event tickets and passes</Text>
            </View>

            {/* Tabs */}
            <View className="flex-row px-5 mb-4">
                {tabs.filter(tab => tab.count > 0 || tab.key === 'ALL').map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        onPress={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 rounded-xl mr-2 ${activeTab === tab.key ? 'bg-primary' : 'bg-card border border-border'}`}
                    >
                        <Text className={`font-bold ${activeTab === tab.key ? 'text-white' : 'text-text-secondary'}`}>
                            {tab.label} ({tab.count})
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Tickets List */}
            <View className="flex-1 px-4">
                <FlatList
                    data={filteredTickets}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                    }
                    ListEmptyComponent={!loading ? (
                        <View className="items-center justify-center py-20">
                            <View className="bg-border/30 w-20 h-20 rounded-full items-center justify-center mb-4">
                                <Ticket size={40} color={COLORS.textLight} />
                            </View>
                            <Text className="text-text font-bold text-lg">
                                {activeTab === 'ALL' ? 'No tickets yet' : `No ${activeTab.toLowerCase()} tickets`}
                            </Text>
                            <Text className="text-text-secondary text-sm mt-1 text-center px-8">
                                {activeTab === 'ALL'
                                    ? 'Register for events to get your tickets here'
                                    : 'Check other tabs to see your tickets'}
                            </Text>
                        </View>
                    ) : null}
                />
            </View>
        </SafeAreaView>
    );
}
