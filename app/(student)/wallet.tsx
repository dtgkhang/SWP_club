import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowDownLeft, ArrowUpRight, Calendar, CheckCircle, ChevronRight, Clock, CreditCard, ExternalLink, MapPin, QrCode, Receipt, Sparkles, Star, Ticket, Video, X, XCircle } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { DimensionValue, Dimensions, FlatList, Linking, Modal, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { useToast } from '../../contexts/ToastContext';
import { eventService } from '../../services/event.service';
import { TransactionListItem, transactionService } from '../../services/transaction.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const QR_POPUP_SIZE = SCREEN_WIDTH - 100;

type SectionType = 'TICKETS' | 'TRANSACTIONS';
type TabType = 'ALL' | 'ACTIVE' | 'USED' | 'EXPIRED';
type TransactionFilterType = 'ALL' | 'PENDING' | 'SUCCESS' | 'FAILED';
type FilterTab = { key: string; label: string; count: number; emoji: string };


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

// Transaction Skeleton
const TransactionSkeleton = () => (
    <View className="mb-3 mx-1">
        <View className="bg-card rounded-2xl border border-border p-4 flex-row items-center">
            <Skeleton width={48} height={48} rounded={12} />
            <View className="flex-1 ml-4">
                <Skeleton width="70%" height={16} rounded={4} />
                <View className="mt-2">
                    <Skeleton width="50%" height={12} rounded={4} />
                </View>
            </View>
            <Skeleton width={80} height={20} rounded={4} />
        </View>
    </View>
);

export default function WalletScreen() {
    const router = useRouter();
    const { showError } = useToast();

    // Section State
    const [activeSection, setActiveSection] = useState<SectionType>('TICKETS');

    // Ticket States
    const [tickets, setTickets] = useState<any[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(true);
    const [refreshingTickets, setRefreshingTickets] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('ALL');
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [showQRModal, setShowQRModal] = useState(false);

    // Transaction States
    const [transactions, setTransactions] = useState<TransactionListItem[]>([]);
    const [loadingTransactions, setLoadingTransactions] = useState(true);
    const [refreshingTransactions, setRefreshingTransactions] = useState(false);
    const [transactionFilter, setTransactionFilter] = useState<TransactionFilterType>('ALL');

    useFocusEffect(
        useCallback(() => {
            if (activeSection === 'TICKETS') {
                loadTickets();
            } else {
                loadTransactions();
            }
        }, [activeSection])
    );

    const loadTickets = async () => {
        try {
            if (tickets.length === 0) setLoadingTickets(true);
            const data = await eventService.getMyTickets();
            const validTickets = data.filter((t: any) => t.status !== 'RESERVED');
            setTickets(validTickets);
        } catch (error) {
            console.log('Error loading tickets:', error);
        } finally {
            setLoadingTickets(false);
            setRefreshingTickets(false);
        }
    };

    const loadTransactions = async () => {
        try {
            if (transactions.length === 0) setLoadingTransactions(true);
            const statusFilter = transactionFilter === 'ALL' ? undefined : transactionFilter as any;
            const { transactions: data } = await transactionService.getMyTransactions({ status: statusFilter });
            setTransactions(data);
        } catch (error) {
            console.log('Error loading transactions:', error);
        } finally {
            setLoadingTransactions(false);
            setRefreshingTransactions(false);
        }
    };

    const onRefreshTickets = () => {
        setRefreshingTickets(true);
        loadTickets();
    };

    const onRefreshTransactions = () => {
        setRefreshingTransactions(true);
        loadTransactions();
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

    const getTransactionStatusInfo = (status: string) => {
        switch (status) {
            case 'SUCCESS':
                return { label: 'Success', color: COLORS.success, bgClass: 'bg-success' };
            case 'PENDING':
                return { label: 'Pending', color: COLORS.warning, bgClass: 'bg-warning' };
            case 'FAILED':
                return { label: 'Failed', color: COLORS.error, bgClass: 'bg-error' };
            case 'CANCELLED':
                return { label: 'Cancelled', color: COLORS.textLight, bgClass: 'bg-gray-400' };
            case 'REFUNDED':
                return { label: 'Refunded', color: COLORS.secondary, bgClass: 'bg-secondary' };
            default:
                return { label: status, color: COLORS.textSecondary, bgClass: 'bg-gray-400' };
        }
    };

    const getTransactionTypeInfo = (type: string) => {
        switch (type) {
            case 'MEMBERSHIP':
                return { label: 'Membership', icon: CreditCard, color: COLORS.primary };
            case 'EVENT_TICKET':
                return { label: 'Event Ticket', icon: Ticket, color: COLORS.secondary };
            case 'TOPUP':
                return { label: 'Top Up', icon: ArrowDownLeft, color: COLORS.success };
            case 'REFUND':
                return { label: 'Refund', icon: ArrowUpRight, color: COLORS.warning };
            default:
                return { label: type, icon: Receipt, color: COLORS.textSecondary };
        }
    };

    const filteredTickets = tickets.filter(ticket => {
        if (activeTab === 'ALL') return true;
        const info = getStatusInfo(ticket.status);
        return info.category === activeTab;
    });

    const filteredTransactions = transactions.filter(tx => {
        if (transactionFilter === 'ALL') return true;
        return tx.status === transactionFilter;
    });

    const ticketCounts = {
        all: tickets.length,
        active: tickets.filter(t => ['PAID', 'INIT', 'RESERVED'].includes(t.status)).length,
        used: tickets.filter(t => t.status === 'USED').length,
        expired: tickets.filter(t => ['EXPIRED', 'CANCELLED'].includes(t.status)).length,
    };

    const transactionCounts = {
        all: transactions.length,
        pending: transactions.filter(t => t.status === 'PENDING').length,
        success: transactions.filter(t => t.status === 'SUCCESS').length,
        failed: transactions.filter(t => ['FAILED', 'CANCELLED'].includes(t.status)).length,
    };

    const ticketTabs: { key: TabType; label: string; count: number; emoji: string }[] = [
        { key: 'ALL', label: 'All', count: ticketCounts.all, emoji: '🎫' },
        { key: 'ACTIVE', label: 'Active', count: ticketCounts.active, emoji: '✨' },
        { key: 'USED', label: 'Used', count: ticketCounts.used, emoji: '✅' },
        { key: 'EXPIRED', label: 'Expired', count: ticketCounts.expired, emoji: '⏰' },
    ];

    const transactionTabs: { key: TransactionFilterType; label: string; count: number; emoji: string }[] = [
        { key: 'ALL', label: 'All', count: transactionCounts.all, emoji: '📋' },
        { key: 'PENDING', label: 'Pending', count: transactionCounts.pending, emoji: '⏳' },
        { key: 'SUCCESS', label: 'Success', count: transactionCounts.success, emoji: '✅' },
        { key: 'FAILED', label: 'Failed', count: transactionCounts.failed, emoji: '❌' },
    ];

    // Generate QR image URL
    const getQRImageUrl = (qrCode: string) => {
        if (!qrCode) return null;
        if (qrCode.startsWith('http')) return qrCode;
        return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrCode)}&format=png&margin=10`;
    };

    // Premium Ticket Card
    const renderTicketItem = ({ item, index }: { item: any; index: number }) => {
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
                                <View className="flex-row items-center bg-success-soft px-4 py-2.5 rounded-xl mb-3">
                                    <CheckCircle size={16} color={COLORS.success} />
                                    <Text className="text-success text-sm font-medium ml-2">
                                        Checked in: {new Date(item.usedAt).toLocaleString('vi-VN')}
                                    </Text>
                                </View>
                                {/* Rate Event Button */}
                                <TouchableOpacity
                                    className="flex-row items-center justify-center bg-primary py-3 rounded-xl"
                                    onPress={() => router.push({ pathname: '/(student)/events/feedback', params: { id: item.event?.id } })}
                                    style={{
                                        shadowColor: COLORS.primary,
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.2,
                                        shadowRadius: 4,
                                    }}
                                >
                                    <Star size={18} color="#FFF" fill="#FFF" />
                                    <Text className="text-white font-bold text-sm ml-2">Rate This Event</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    // Transaction Card
    const renderTransactionItem = ({ item }: { item: TransactionListItem }) => {
        const statusInfo = getTransactionStatusInfo(item.status);
        const typeInfo = getTransactionTypeInfo(item.type);
        const TypeIcon = typeInfo.icon;

        const getDescription = () => {
            if (item.type === 'MEMBERSHIP' && item.referenceMembership?.club) {
                return item.referenceMembership.club.name;
            }
            if (item.type === 'EVENT_TICKET' && item.referenceTicket?.event) {
                return item.referenceTicket.event.title;
            }
            if (item.club) {
                return item.club.name;
            }
            return typeInfo.label;
        };

        return (
            <TouchableOpacity
                className="mb-3 mx-1"
                activeOpacity={0.8}
                onPress={() => {
                    // Could navigate to transaction detail in future
                }}
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                }}
            >
                <View className="bg-card rounded-2xl border border-border p-4">
                    <View className="flex-row items-center">
                        {/* Icon */}
                        <View
                            className="w-12 h-12 rounded-xl items-center justify-center"
                            style={{ backgroundColor: typeInfo.color + '15' }}
                        >
                            <TypeIcon size={24} color={typeInfo.color} />
                        </View>

                        {/* Info */}
                        <View className="flex-1 ml-4">
                            <Text className="text-text font-bold text-base" numberOfLines={1}>
                                {getDescription()}
                            </Text>
                            <View className="flex-row items-center mt-1">
                                <Text className="text-text-secondary text-sm">
                                    {new Date(item.createdAt).toLocaleDateString('vi-VN', {
                                        day: 'numeric', month: 'short', year: 'numeric'
                                    })}
                                </Text>
                                <Text className="text-text-secondary mx-2">•</Text>
                                <Text className="text-text-secondary text-sm">
                                    {typeInfo.label}
                                </Text>
                            </View>
                        </View>

                        {/* Amount & Status */}
                        <View className="items-end">
                            <Text className="text-text font-bold text-base">
                                {item.amount.toLocaleString()}₫
                            </Text>
                            <View
                                className={`px-2 py-0.5 rounded-full mt-1 ${statusInfo.bgClass}`}
                            >
                                <Text className="text-white text-xs font-bold">
                                    {statusInfo.label}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    // Loading State
    const isLoading = activeSection === 'TICKETS' ? loadingTickets : loadingTransactions;
    const isEmpty = activeSection === 'TICKETS' ? tickets.length === 0 : transactions.length === 0;

    if (isLoading && isEmpty) {
        return (
            <SafeAreaView className="flex-1 bg-background" edges={['top']}>
                <View className="px-5 pt-3 pb-5">
                    <Text className="text-text text-2xl font-bold">Wallet</Text>
                    <Text className="text-text-secondary text-sm mt-1">Your tickets & transactions</Text>
                </View>
                <View className="flex-row px-5 mb-4">
                    {[1, 2].map(i => (
                        <View key={i} className="mr-3">
                            <Skeleton width={120} height={44} rounded={22} />
                        </View>
                    ))}
                </View>
                <View className="flex-row px-5 mb-4">
                    {[1, 2, 3].map(i => (
                        <View key={i} className="mr-2">
                            <Skeleton width={90} height={40} rounded={20} />
                        </View>
                    ))}
                </View>
                <View className="flex-1 px-4">
                    {activeSection === 'TICKETS' ? (
                        <>
                            <TicketSkeleton />
                            <TicketSkeleton />
                        </>
                    ) : (
                        <>
                            <TransactionSkeleton />
                            <TransactionSkeleton />
                            <TransactionSkeleton />
                        </>
                    )}
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
                        <Text className="text-text text-2xl font-bold">Wallet</Text>
                        <Text className="text-text-secondary text-sm mt-0.5">
                            {activeSection === 'TICKETS'
                                ? `${ticketCounts.active} active ticket${ticketCounts.active !== 1 ? 's' : ''}`
                                : `${transactionCounts.all} transaction${transactionCounts.all !== 1 ? 's' : ''}`}
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
                        {activeSection === 'TICKETS' ? (
                            <Ticket size={26} color={COLORS.primary} />
                        ) : (
                            <Receipt size={26} color={COLORS.primary} />
                        )}
                    </View>
                </View>
            </View>

            {/* Section Toggle */}
            <View className="px-5 mb-4">
                <View className="flex-row bg-card border border-border rounded-2xl p-1">
                    <TouchableOpacity
                        className={`flex-1 py-3 rounded-xl items-center flex-row justify-center ${activeSection === 'TICKETS' ? 'bg-primary' : ''}`}
                        onPress={() => setActiveSection('TICKETS')}
                        style={activeSection === 'TICKETS' ? {
                            shadowColor: COLORS.primary,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                        } : {}}
                    >
                        <Ticket size={18} color={activeSection === 'TICKETS' ? '#FFF' : COLORS.textSecondary} />
                        <Text className={`font-bold ml-2 ${activeSection === 'TICKETS' ? 'text-white' : 'text-text-secondary'}`}>
                            Tickets
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`flex-1 py-3 rounded-xl items-center flex-row justify-center ${activeSection === 'TRANSACTIONS' ? 'bg-primary' : ''}`}
                        onPress={() => {
                            setActiveSection('TRANSACTIONS');
                            if (transactions.length === 0) loadTransactions();
                        }}
                        style={activeSection === 'TRANSACTIONS' ? {
                            shadowColor: COLORS.primary,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                        } : {}}
                    >
                        <Receipt size={18} color={activeSection === 'TRANSACTIONS' ? '#FFF' : COLORS.textSecondary} />
                        <Text className={`font-bold ml-2 ${activeSection === 'TRANSACTIONS' ? 'text-white' : 'text-text-secondary'}`}>
                            Transactions
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Filter Tabs */}
            <View className="mb-4">
                <FlatList<FilterTab>
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 20 }}
                    data={(activeSection === 'TICKETS'
                        ? ticketTabs.filter(tab => tab.count > 0 || tab.key === 'ALL')
                        : transactionTabs.filter(tab => tab.count > 0 || tab.key === 'ALL')
                    ) as FilterTab[]}
                    keyExtractor={(item) => item.key}
                    renderItem={({ item: tab }) => {
                        const isActive = activeSection === 'TICKETS'
                            ? activeTab === tab.key
                            : transactionFilter === tab.key;

                        return (
                            <TouchableOpacity
                                onPress={() => {
                                    if (activeSection === 'TICKETS') {
                                        setActiveTab(tab.key as TabType);
                                    } else {
                                        setTransactionFilter(tab.key as TransactionFilterType);
                                    }
                                }}
                                className={`px-5 py-3 rounded-full mr-3 flex-row items-center ${isActive ? 'bg-primary' : 'bg-card border border-border'
                                    }`}
                                style={isActive ? {
                                    shadowColor: COLORS.primary,
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 8,
                                } : {}}
                            >
                                <Text className="mr-1">{tab.emoji}</Text>
                                <Text className={`font-bold ${isActive ? 'text-white' : 'text-text-secondary'}`}>
                                    {tab.label}
                                </Text>
                                <View
                                    className={`ml-2 px-2 py-0.5 rounded-full ${isActive ? 'bg-white/25' : 'bg-border'
                                        }`}
                                >
                                    <Text className={`text-xs font-bold ${isActive ? 'text-white' : 'text-text-secondary'}`}>
                                        {tab.count}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>

            {/* Content List */}
            {activeSection === 'TICKETS' ? (
                <FlatList
                    data={filteredTickets}
                    renderItem={renderTicketItem}
                    keyExtractor={item => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshingTickets} onRefresh={onRefreshTickets} tintColor={COLORS.primary} />
                    }
                    ListEmptyComponent={!loadingTickets ? (
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
            ) : (
                <FlatList
                    data={filteredTransactions}
                    renderItem={renderTransactionItem}
                    keyExtractor={item => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshingTransactions} onRefresh={onRefreshTransactions} tintColor={COLORS.primary} />
                    }
                    ListEmptyComponent={!loadingTransactions ? (
                        <View className="items-center justify-center py-20">
                            <View
                                className="w-24 h-24 rounded-full items-center justify-center mb-5"
                                style={{ backgroundColor: COLORS.primary + '15' }}
                            >
                                <Receipt size={48} color={COLORS.primary} />
                            </View>
                            <Text className="text-text font-bold text-xl mb-2">
                                {transactionFilter === 'ALL' ? 'No transactions yet' : `No ${transactionFilter.toLowerCase()} transactions`}
                            </Text>
                            <Text className="text-text-secondary text-sm text-center px-10">
                                {transactionFilter === 'ALL'
                                    ? 'Your payment history will appear here'
                                    : 'Check other tabs to see your transactions'}
                            </Text>
                        </View>
                    ) : null}
                />
            )}
        </SafeAreaView>
    );
}
