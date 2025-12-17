import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { Calendar, CheckCircle, ChevronRight, Clock, ExternalLink, MapPin, QrCode, Sparkles, Ticket, Video, X, XCircle } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { DimensionValue, Dimensions, FlatList, Linking, Modal, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { useToast } from '../../contexts/ToastContext';
import { eventService } from '../../services/event.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const QR_POPUP_SIZE = SCREEN_WIDTH - 100;

type TabType = 'ALL' | 'ACTIVE' | 'USED' | 'EXPIRED';

// Skeleton Component
const Skeleton = ({ width, height, rounded = 8 }: { width: DimensionValue; height: number; rounded?: number }) => (
    <View
        className="bg-border/40 overflow-hidden"
        style={{ width, height, borderRadius: rounded }}
    />
);

// Premium Ticket Skeleton
const TicketSkeleton = () => (
    <View className="mb-4 mx-1">
        <View
            className="bg-card rounded-3xl overflow-hidden border border-border"
            style={{ height: 180 }}
        >
            <View className="p-5">
                <View className="flex-row justify-between mb-4">
                    <View className="flex-1 mr-4">
                        <Skeleton width="80%" height={22} rounded={6} />
                        <View className="mt-3">
                            <Skeleton width="60%" height={14} rounded={4} />
                        </View>
                    </View>
                    <Skeleton width={70} height={28} rounded={14} />
                </View>
                <View className="flex-row items-center mt-4">
                    <Skeleton width={120} height={44} rounded={12} />
                    <View className="flex-1" />
                    <Skeleton width={100} height={44} rounded={12} />
                </View>
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
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [showQRModal, setShowQRModal] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadTickets();
        }, [])
    );

    const loadTickets = async () => {
        try {
            // Only set loading on first load
            if (tickets.length === 0) setLoading(true);
            const data = await eventService.getMyTickets();

            // Filter out RESERVED status (pending/abandoned payments)
            const validTickets = data.filter((t: any) => t.status !== 'RESERVED');
            setTickets(validTickets);
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
                return { label: 'Active', color: COLORS.success, bgClass: 'bg-success', category: 'ACTIVE', icon: '✓' };
            case 'USED':
                return { label: 'Used', color: COLORS.secondary, bgClass: 'bg-secondary', category: 'USED', icon: '✓' };
            case 'EXPIRED':
                return { label: 'Expired', color: COLORS.textLight, bgClass: 'bg-gray-400', category: 'EXPIRED', icon: '✗' };
            case 'CANCELLED':
            case 'RESERVED':
                return { label: 'Cancelled', color: COLORS.error, bgClass: 'bg-red-500', category: 'EXPIRED', icon: '✗' };
            default:
                return { label: 'Valid', color: COLORS.primary, bgClass: 'bg-primary', category: 'ACTIVE', icon: '✓' };
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

    const tabs: { key: TabType; label: string; count: number; emoji: string }[] = [
        { key: 'ALL', label: 'All', count: counts.all, emoji: '🎫' },
        { key: 'ACTIVE', label: 'Active', count: counts.active, emoji: '✨' },
        { key: 'USED', label: 'Used', count: counts.used, emoji: '✅' },
        { key: 'EXPIRED', label: 'Expired', count: counts.expired, emoji: '⏰' },
    ];

    // Generate QR image URL - handle both direct URLs and text codes
    const getQRImageUrl = (qrCode: string) => {
        if (!qrCode) return null;
        // If already a URL, use directly
        if (qrCode.startsWith('http')) return qrCode;
        // Otherwise generate via API
        return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrCode)}&format=png&margin=10`;
    };

    // Premium Ticket Card
    const renderItem = ({ item, index }: { item: any; index: number }) => {
        const statusInfo = getStatusInfo(item.status);
        const isInactive = ['USED', 'EXPIRED', 'CANCELLED'].includes(item.status);
        const isOnline = item.onlineLink || item.event?.format === 'ONLINE';

        return (
            <TouchableOpacity
                className={`mb-4 mx-1 ${isInactive ? 'opacity-70' : ''}`}
                onPress={() => !isInactive && item.qrCode && openQRPopup(item)}
                activeOpacity={0.9}
                disabled={isInactive || !item.qrCode}
                style={{
                    shadowColor: isInactive ? '#000' : COLORS.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isInactive ? 0.05 : 0.15,
                    shadowRadius: 12,
                    elevation: 6,
                }}
            >
                <View className="bg-card rounded-3xl overflow-hidden border border-border">
                    {/* Top Section - Event Info */}
                    <View
                        className={`p-5 ${isInactive ? 'bg-gray-100' : ''}`}
                        style={!isInactive ? {
                            backgroundColor: COLORS.primary + '08',
                            borderBottomWidth: 1,
                            borderBottomColor: COLORS.border,
                        } : {}}
                    >
                        <View className="flex-row justify-between items-start mb-3">
                            <View className="flex-1 mr-4">
                                <Text
                                    className="text-text font-bold text-lg mb-1"
                                    numberOfLines={2}
                                    style={{ lineHeight: 24 }}
                                >
                                    {item.event?.title || 'Event Ticket'}
                                </Text>
                                <Text className="text-text-secondary text-sm" numberOfLines={1}>
                                    {item.event?.club?.name || 'Club Event'}
                                </Text>
                            </View>

                            {/* Status Badge */}
                            <View
                                className={`px-3 py-1.5 rounded-full flex-row items-center ${statusInfo.bgClass}`}
                                style={{
                                    shadowColor: statusInfo.color,
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 4,
                                }}
                            >
                                {item.status === 'USED' && <CheckCircle size={12} color="#FFF" />}
                                {['EXPIRED', 'CANCELLED'].includes(item.status) && <XCircle size={12} color="#FFF" />}
                                {!isInactive && <Sparkles size={12} color="#FFF" />}
                                <Text className="text-white text-xs font-bold ml-1 uppercase">
                                    {statusInfo.label}
                                </Text>
                            </View>
                        </View>

                        {/* Event Meta */}
                        <View className="flex-row items-center flex-wrap gap-3">
                            <View className="flex-row items-center bg-background px-3 py-1.5 rounded-lg">
                                <Calendar size={14} color={COLORS.primary} />
                                <Text className="text-text text-sm font-medium ml-1.5">
                                    {item.event?.startTime ? new Date(item.event.startTime).toLocaleDateString('vi-VN', {
                                        day: 'numeric', month: 'short', year: 'numeric'
                                    }) : 'TBA'}
                                </Text>
                            </View>

                            <View className="flex-row items-center bg-background px-3 py-1.5 rounded-lg">
                                <Clock size={14} color={COLORS.secondary} />
                                <Text className="text-text text-sm font-medium ml-1.5">
                                    {item.event?.startTime ? new Date(item.event.startTime).toLocaleTimeString('vi-VN', {
                                        hour: '2-digit', minute: '2-digit'
                                    }) : '--:--'}
                                </Text>
                            </View>

                            <View className="flex-row items-center bg-background px-3 py-1.5 rounded-lg flex-1">
                                {isOnline ? (
                                    <>
                                        <Video size={14} color="#8B5CF6" />
                                        <Text className="text-text text-sm font-medium ml-1.5">Online</Text>
                                    </>
                                ) : (
                                    <>
                                        <MapPin size={14} color={COLORS.error} />
                                        <Text className="text-text text-sm font-medium ml-1.5" numberOfLines={1}>
                                            {item.event?.location || 'TBD'}
                                        </Text>
                                    </>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Bottom Section - Action Area */}
                    <View className="relative">
                        {/* Decorative ticket cutouts */}
                        <View
                            className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-background"
                            style={{ marginTop: -3 }}
                        />
                        <View
                            className="absolute -right-3 top-0 w-6 h-6 rounded-full bg-background"
                            style={{ marginTop: -3 }}
                        />

                        {/* Dashed line */}
                        <View className="absolute top-0 left-5 right-5 border-t border-dashed border-border" />

                        <View className="p-4 pt-5 flex-row items-center justify-between">
                            {/* QR Preview (small) or Status */}
                            {item.qrCode && !isInactive ? (
                                <View className="flex-row items-center">
                                    <View
                                        className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-border items-center justify-center"
                                        style={{
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.1,
                                            shadowRadius: 4,
                                        }}
                                    >
                                        <Image
                                            source={{ uri: getQRImageUrl(item.qrCode) || '' }}
                                            style={{ width: 46, height: 46 }}
                                            contentFit="contain"
                                            transition={0}
                                        />
                                    </View>
                                    <View className="ml-3">
                                        <Text className="text-text-secondary text-xs">Ticket Code</Text>
                                        <Text className="text-text font-mono text-sm font-bold">
                                            {item.qrCode?.substring(0, 8).toUpperCase()}...
                                        </Text>
                                    </View>
                                </View>
                            ) : (
                                <View className="flex-row items-center">
                                    <View className="w-14 h-14 rounded-xl bg-gray-100 items-center justify-center">
                                        {isInactive ? (
                                            item.status === 'USED' ? (
                                                <CheckCircle size={28} color={COLORS.success} />
                                            ) : (
                                                <XCircle size={28} color={COLORS.textLight} />
                                            )
                                        ) : (
                                            <QrCode size={28} color={COLORS.textLight} />
                                        )}
                                    </View>
                                    <View className="ml-3">
                                        <Text className="text-text-secondary text-xs">Status</Text>
                                        <Text className="text-text font-medium">
                                            {isInactive ? statusInfo.label : 'No QR Code'}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {/* Action Button */}
                            {item.onlineLink && !isInactive ? (
                                <TouchableOpacity
                                    className="flex-row items-center px-5 py-3 rounded-xl"
                                    style={{ backgroundColor: '#8B5CF6' }}
                                    onPress={() => Linking.openURL(item.onlineLink)}
                                >
                                    <ExternalLink size={18} color="#FFF" />
                                    <Text className="text-white font-bold text-sm ml-2">Join Event</Text>
                                </TouchableOpacity>
                            ) : item.qrCode && !isInactive ? (
                                <View
                                    className="flex-row items-center px-5 py-3 rounded-xl bg-primary"
                                    style={{
                                        shadowColor: COLORS.primary,
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: 0.3,
                                        shadowRadius: 8,
                                    }}
                                >
                                    <QrCode size={18} color="#FFF" />
                                    <Text className="text-white font-bold text-sm ml-2">View QR</Text>
                                    <ChevronRight size={16} color="#FFF" className="ml-1" />
                                </View>
                            ) : (
                                <View className="flex-row items-center px-5 py-3 rounded-xl bg-gray-200">
                                    <Text className="text-text-secondary font-medium text-sm">
                                        {isInactive ? 'Ticket ' + statusInfo.label : 'Processing...'}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Used At Info */}
                        {item.status === 'USED' && item.usedAt && (
                            <View className="px-4 pb-4">
                                <View className="flex-row items-center bg-success-soft px-4 py-2.5 rounded-xl">
                                    <CheckCircle size={16} color={COLORS.success} />
                                    <Text className="text-success text-sm font-medium ml-2">
                                        Checked in: {new Date(item.usedAt).toLocaleString('vi-VN')}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    // Loading State
    if (loading && tickets.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-background" edges={['top']}>
                <View className="px-5 pt-3 pb-5">
                    <Text className="text-text text-2xl font-bold">My Tickets</Text>
                    <Text className="text-text-secondary text-sm mt-1">Your event passes & tickets</Text>
                </View>
                <View className="flex-row px-5 mb-4">
                    {[1, 2, 3].map(i => (
                        <View key={i} className="mr-2">
                            <Skeleton width={90} height={40} rounded={20} />
                        </View>
                    ))}
                </View>
                <View className="flex-1 px-4">
                    <TicketSkeleton />
                    <TicketSkeleton />
                    <TicketSkeleton />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            {/* QR Popup Modal - Premium Design */}
            <Modal
                visible={showQRModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowQRModal(false)}
            >
                <View className="flex-1 bg-black/90 items-center justify-center p-5">
                    <View
                        className="bg-white rounded-3xl overflow-hidden w-full max-w-sm"
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 20 },
                            shadowOpacity: 0.4,
                            shadowRadius: 30,
                        }}
                    >
                        {/* Modal Header */}
                        <View className="bg-primary p-5 relative">
                            <TouchableOpacity
                                className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full items-center justify-center"
                                onPress={() => setShowQRModal(false)}
                            >
                                <X size={22} color="#FFF" />
                            </TouchableOpacity>

                            <View className="pr-12">
                                <Text className="text-white/80 text-sm font-medium">Event Ticket</Text>
                                <Text className="text-white text-xl font-bold mt-1" numberOfLines={2}>
                                    {selectedTicket?.event?.title || 'Event'}
                                </Text>
                            </View>
                        </View>

                        {/* QR Code Section */}
                        <View className="p-6 items-center">
                            <View
                                className="bg-white p-4 rounded-2xl border-2 border-border"
                                style={{
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 12,
                                }}
                            >
                                {selectedTicket?.qrCode ? (
                                    <Image
                                        source={{ uri: getQRImageUrl(selectedTicket.qrCode) || '' }}
                                        style={{ width: QR_POPUP_SIZE, height: QR_POPUP_SIZE }}
                                        contentFit="contain"
                                        transition={0}
                                    />
                                ) : (
                                    <View
                                        style={{ width: QR_POPUP_SIZE, height: QR_POPUP_SIZE }}
                                        className="items-center justify-center bg-gray-100 rounded-xl"
                                    >
                                        <QrCode size={60} color={COLORS.textLight} />
                                        <Text className="text-text-secondary text-sm mt-2">No QR Code</Text>
                                    </View>
                                )}
                            </View>

                            {/* Ticket Code */}
                            <View className="mt-4 bg-background px-5 py-3 rounded-xl border border-border">
                                <Text className="text-text-secondary text-xs text-center mb-1">Ticket Code</Text>
                                <Text className="text-text font-mono text-base font-bold text-center">
                                    {selectedTicket?.qrCode?.toUpperCase() || 'N/A'}
                                </Text>
                            </View>

                            {/* Event Info */}
                            <View className="flex-row items-center mt-4 space-x-4">
                                <View className="flex-row items-center">
                                    <Calendar size={16} color={COLORS.primary} />
                                    <Text className="text-text text-sm font-medium ml-2">
                                        {selectedTicket?.event?.startTime
                                            ? new Date(selectedTicket.event.startTime).toLocaleDateString('vi-VN', {
                                                day: 'numeric', month: 'short'
                                            })
                                            : 'TBA'}
                                    </Text>
                                </View>
                                <View className="flex-row items-center ml-4">
                                    <Clock size={16} color={COLORS.secondary} />
                                    <Text className="text-text text-sm font-medium ml-2">
                                        {selectedTicket?.event?.startTime
                                            ? new Date(selectedTicket.event.startTime).toLocaleTimeString('vi-VN', {
                                                hour: '2-digit', minute: '2-digit'
                                            })
                                            : '--:--'}
                                    </Text>
                                </View>
                            </View>

                            {/* Instructions */}
                            <View className="mt-5 bg-primary-soft px-4 py-3 rounded-xl">
                                <Text className="text-primary text-sm text-center font-medium">
                                    📱 Show this code to staff at entrance
                                </Text>
                            </View>
                        </View>

                        {/* Close Button */}
                        <View className="p-5 pt-0">
                            <TouchableOpacity
                                className="bg-primary py-4 rounded-xl items-center"
                                onPress={() => setShowQRModal(false)}
                                style={{
                                    shadowColor: COLORS.primary,
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 8,
                                }}
                            >
                                <Text className="text-white font-bold text-base">Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Header */}
            <View className="px-5 pt-3 pb-4">
                <View className="flex-row items-center justify-between">
                    <View>
                        <Text className="text-text text-2xl font-bold">My Tickets</Text>
                        <Text className="text-text-secondary text-sm mt-0.5">
                            {counts.active} active ticket{counts.active !== 1 ? 's' : ''}
                        </Text>
                    </View>
                    <View
                        className="w-14 h-14 bg-primary-soft rounded-2xl items-center justify-center"
                        style={{
                            shadowColor: COLORS.primary,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.2,
                            shadowRadius: 8,
                        }}
                    >
                        <Ticket size={26} color={COLORS.primary} />
                    </View>
                </View>
            </View>

            {/* Tabs - Pill Style */}
            <View className="mb-4">
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 20 }}
                    data={tabs.filter(tab => tab.count > 0 || tab.key === 'ALL')}
                    keyExtractor={(item) => item.key}
                    renderItem={({ item: tab }) => (
                        <TouchableOpacity
                            onPress={() => setActiveTab(tab.key)}
                            className={`px-5 py-3 rounded-full mr-3 flex-row items-center ${activeTab === tab.key ? 'bg-primary' : 'bg-card border border-border'
                                }`}
                            style={activeTab === tab.key ? {
                                shadowColor: COLORS.primary,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                            } : {}}
                        >
                            <Text className="mr-1">{tab.emoji}</Text>
                            <Text className={`font-bold ${activeTab === tab.key ? 'text-white' : 'text-text-secondary'}`}>
                                {tab.label}
                            </Text>
                            <View
                                className={`ml-2 px-2 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-white/25' : 'bg-border'
                                    }`}
                            >
                                <Text className={`text-xs font-bold ${activeTab === tab.key ? 'text-white' : 'text-text-secondary'}`}>
                                    {tab.count}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* Tickets List */}
            <FlatList
                data={filteredTickets}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
                ListEmptyComponent={!loading ? (
                    <View className="items-center justify-center py-20">
                        <View
                            className="w-24 h-24 rounded-full items-center justify-center mb-5"
                            style={{ backgroundColor: COLORS.primary + '15' }}
                        >
                            <Ticket size={48} color={COLORS.primary} />
                        </View>
                        <Text className="text-text font-bold text-xl mb-2">
                            {activeTab === 'ALL' ? 'No tickets yet' : `No ${activeTab.toLowerCase()} tickets`}
                        </Text>
                        <Text className="text-text-secondary text-sm text-center px-10">
                            {activeTab === 'ALL'
                                ? 'Register for events to get your tickets here'
                                : 'Check other tabs to see your tickets'}
                        </Text>
                    </View>
                ) : null}
            />
        </SafeAreaView>
    );
}
