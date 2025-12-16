import { Calendar, CheckCircle, ExternalLink, MapPin, QrCode, Ticket, Video, X, XCircle, ZoomIn } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { DimensionValue, Dimensions, FlatList, Image, Linking, Modal, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { useToast } from '../../contexts/ToastContext';
import { eventService } from '../../services/event.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const QR_POPUP_SIZE = SCREEN_WIDTH - 80;

type TabType = 'ALL' | 'ACTIVE' | 'USED' | 'EXPIRED';

// Skeleton Component
const Skeleton = ({ width, height, rounded = 8 }: { width: DimensionValue; height: number; rounded?: number }) => (
    <View
        className="bg-border/50 overflow-hidden"
        style={{ width, height, borderRadius: rounded }}
    >
        <View className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </View>
);

// Ticket Skeleton
const TicketSkeleton = () => (
    <View className="bg-card rounded-2xl mb-4 overflow-hidden border border-border mx-1">
        {/* Header Skeleton */}
        <View className="p-4 bg-border/30 flex-row justify-between items-center">
            <View className="flex-1 mr-4">
                <Skeleton width="70%" height={18} rounded={4} />
                <View className="flex-row items-center mt-2">
                    <Skeleton width={80} height={12} rounded={4} />
                    <View className="mx-2" />
                    <Skeleton width={60} height={12} rounded={4} />
                </View>
            </View>
            <Skeleton width={60} height={24} rounded={8} />
        </View>

        {/* QR Skeleton */}
        <View className="p-6 items-center justify-center bg-card relative">
            <View className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-background" />
            <View className="absolute -right-3 top-0 w-6 h-6 rounded-full bg-background" />
            <View className="absolute top-0 left-6 right-6 border-t border-dashed border-border" />
            <Skeleton width={144} height={144} rounded={12} />
            <View className="mt-4">
                <Skeleton width={180} height={12} rounded={4} />
            </View>
        </View>
    </View>
);

export default function WalletScreen() {
    const { showError } = useToast();
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('ALL');

    // QR Popup state
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [showQRModal, setShowQRModal] = useState(false);

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

    const openQRPopup = (ticket: any) => {
        setSelectedTicket(ticket);
        setShowQRModal(true);
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
            <TouchableOpacity
                className={`bg-card rounded-2xl mb-4 overflow-hidden border border-border mx-1 shadow-sm ${isInactive ? 'opacity-70' : ''}`}
                onPress={() => !isInactive && item.qrCode && openQRPopup(item)}
                activeOpacity={0.8}
                disabled={isInactive || !item.qrCode}
            >
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
                            {item.onlineLink || item.event?.format === 'ONLINE' ? (
                                <>
                                    <Video size={12} color="rgba(255,255,255,0.8)" />
                                    <Text className="text-white/80 text-xs ml-1">Online Event</Text>
                                </>
                            ) : (
                                <>
                                    <MapPin size={12} color="rgba(255,255,255,0.8)" />
                                    <Text className="text-white/80 text-xs ml-1" numberOfLines={1}>
                                        {item.event?.location || 'TBD'}
                                    </Text>
                                </>
                            )}
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

                {/* Ticket Body - No QR shown directly */}
                <View className="p-4 bg-card relative">
                    {/* Decorative cutouts */}
                    <View className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-background" />
                    <View className="absolute -right-3 top-0 w-6 h-6 rounded-full bg-background" />
                    <View className="absolute top-0 left-6 right-6 border-t border-dashed border-border" />

                    {/* Event details */}
                    <View className="flex-row items-center justify-between pt-2">
                        <View className="flex-1">
                            <Text className="text-text-secondary text-xs">Event Time</Text>
                            <Text className="text-text font-medium text-sm">
                                {item.event?.startTime ? new Date(item.event.startTime).toLocaleString('vi-VN', {
                                    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                }) : 'TBA'}
                            </Text>
                        </View>

                        {/* View QR Button OR Join Online Button OR Status */}
                        {item.onlineLink && !isInactive ? (
                            <TouchableOpacity
                                className="bg-purple-600 px-4 py-2 rounded-xl flex-row items-center"
                                onPress={() => Linking.openURL(item.onlineLink)}
                            >
                                <ExternalLink size={16} color="#FFF" />
                                <Text className="text-white font-bold text-sm ml-2">Join</Text>
                            </TouchableOpacity>
                        ) : item.qrCode && !isInactive ? (
                            <View className="bg-primary px-4 py-2 rounded-xl flex-row items-center">
                                <QrCode size={16} color="#FFF" />
                                <Text className="text-white font-bold text-sm ml-2">View QR</Text>
                            </View>
                        ) : isInactive ? (
                            <View className="bg-gray-200 px-4 py-2 rounded-xl flex-row items-center">
                                {item.status === 'USED' ? (
                                    <>
                                        <CheckCircle size={16} color={COLORS.textSecondary} />
                                        <Text className="text-text-secondary font-medium text-sm ml-2">Used</Text>
                                    </>
                                ) : (
                                    <>
                                        <XCircle size={16} color={COLORS.textSecondary} />
                                        <Text className="text-text-secondary font-medium text-sm ml-2">{statusInfo.label}</Text>
                                    </>
                                )}
                            </View>
                        ) : (
                            <View className="bg-gray-100 px-4 py-2 rounded-xl">
                                <Text className="text-text-secondary font-medium text-sm">Pending</Text>
                            </View>
                        )}
                    </View>

                    {item.status === 'USED' && item.usedAt && (
                        <View className="mt-3 flex-row items-center bg-secondary-soft px-3 py-2 rounded-lg">
                            <CheckCircle size={14} color={COLORS.secondary} />
                            <Text className="text-secondary text-xs font-medium ml-1">
                                Checked in: {new Date(item.usedAt).toLocaleString('vi-VN')}
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    // Loading Skeleton
    if (loading && tickets.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-background" edges={['top']}>
                {/* Header */}
                <View className="px-5 pt-2 pb-4">
                    <Text className="text-text text-2xl font-bold mb-1">My Tickets</Text>
                    <Text className="text-text-secondary text-sm">Your event tickets and passes</Text>
                </View>

                {/* Tabs Skeleton */}
                <View className="flex-row px-5 mb-4">
                    <Skeleton width={80} height={36} rounded={12} />
                    <View className="ml-2" />
                    <Skeleton width={80} height={36} rounded={12} />
                    <View className="ml-2" />
                    <Skeleton width={80} height={36} rounded={12} />
                </View>

                {/* Ticket Skeletons */}
                <View className="flex-1 px-4">
                    <TicketSkeleton />
                    <TicketSkeleton />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            {/* QR Popup Modal */}
            <Modal
                visible={showQRModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowQRModal(false)}
            >
                <View className="flex-1 bg-black/80 items-center justify-center p-6">
                    <View className="bg-white rounded-3xl p-6 items-center w-full max-w-sm">
                        {/* Close Button */}
                        <TouchableOpacity
                            className="absolute top-4 right-4 w-10 h-10 bg-border/30 rounded-full items-center justify-center"
                            onPress={() => setShowQRModal(false)}
                        >
                            <X size={20} color={COLORS.text} />
                        </TouchableOpacity>

                        {/* Event Title */}
                        <Text className="text-text font-bold text-lg mb-2 text-center mt-4">
                            {selectedTicket?.event?.title || 'Event Ticket'}
                        </Text>
                        <Text className="text-text-secondary text-sm mb-6">
                            Scan this code at entrance
                        </Text>

                        {/* Large QR Code */}
                        <View className="bg-white p-4 rounded-2xl border-2 border-border shadow-lg">
                            <Image
                                source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${selectedTicket?.qrCode}` }}
                                style={{ width: QR_POPUP_SIZE, height: QR_POPUP_SIZE }}
                                className="rounded-xl"
                            />
                        </View>

                        {/* QR Code Text */}
                        <View className="mt-4 bg-background px-4 py-2 rounded-xl border border-border">
                            <Text className="text-text font-mono text-sm">
                                {selectedTicket?.qrCode}
                            </Text>
                        </View>

                        {/* Event Info */}
                        <View className="flex-row items-center mt-4">
                            <Calendar size={14} color={COLORS.textSecondary} />
                            <Text className="text-text-secondary text-sm ml-2">
                                {selectedTicket?.event?.startTime
                                    ? new Date(selectedTicket.event.startTime).toLocaleDateString('vi-VN', {
                                        weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                    })
                                    : 'TBA'}
                            </Text>
                        </View>

                        {/* Close */}
                        <TouchableOpacity
                            className="mt-6 bg-primary px-8 py-3 rounded-xl"
                            onPress={() => setShowQRModal(false)}
                        >
                            <Text className="text-white font-bold">Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

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
