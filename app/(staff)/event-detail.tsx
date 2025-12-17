import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, CheckCircle, Clock, Mail, MapPin, QrCode, RefreshCw, Search, Send, Ticket, User, Users, X, XCircle } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import api from '../../services/api';
import { authService } from '../../services/auth.service';
import { useToast } from '../../contexts/ToastContext';

interface Event {
    id: string;
    title: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    format?: string;
    capacity?: number;
    club?: {
        name: string;
        logoUrl?: string;
    };
    _count?: {
        tickets?: number;
    };
}

interface TicketHolder {
    id: string;
    ticketType: string;
    status: string;
    holderName?: string;
    holderEmail?: string;
    holderPhone?: string;
    checkedInAt?: string;
    purchasedAt?: string;
    qrCode?: string;
    user?: {
        id: string;
        fullName?: string;
        email?: string;
        studentCode?: string;
    };
}

export default function StaffEventDetail() {
    const router = useRouter();
    const { showSuccess, showError, showWarning } = useToast();
    const { eventId } = useLocalSearchParams();
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [tickets, setTickets] = useState<TicketHolder[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'ALL' | 'CHECKED_IN' | 'NOT_CHECKED_IN'>('ALL');

    // Email Check-in Modal
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailInput, setEmailInput] = useState('');
    const [emailCheckinLoading, setEmailCheckinLoading] = useState(false);

    useEffect(() => {
        loadEvents();
    }, []);

    useEffect(() => {
        if (eventId && events.length > 0) {
            const event = events.find(e => e.id === eventId);
            if (event) {
                setSelectedEvent(event);
                loadTickets(event.id);
            }
        }
    }, [eventId, events]);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const staffEvents = await authService.getMyStaffEvents();
            setEvents(staffEvents);

            if (staffEvents.length > 0 && !selectedEvent) {
                const firstEvent = staffEvents[0];
                setSelectedEvent(firstEvent);
                loadTickets(firstEvent.id);
            }
        } catch (error) {
            console.log('Error loading events:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const loadTickets = async (eventIdToLoad: string) => {
        try {
            setLoadingTickets(true);
            const response = await api<any>(`/events/${eventIdToLoad}/participants`);
            const participants = response.data?.participants || [];

            if (Array.isArray(participants)) {
                const mappedTickets = participants.map((p: any) => ({
                    id: p.ticket?.id || p.id,
                    ticketType: p.ticket?.ticketType || 'STANDARD',
                    status: p.ticket?.status || 'PAID',
                    qrCode: p.ticket?.qrCode,
                    holderName: p.user?.fullName,
                    holderEmail: p.user?.email,
                    holderPhone: p.user?.phone,
                    checkedInAt: p.checkedInAt,
                    purchasedAt: p.registeredAt,
                    user: p.user
                }));
                setTickets(mappedTickets);
            } else {
                setTickets([]);
            }
        } catch (error) {
            console.log('Error loading tickets:', error);
            setTickets([]);
        } finally {
            setLoadingTickets(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadEvents();
        if (selectedEvent) {
            loadTickets(selectedEvent.id);
        }
    };

    const selectEvent = (event: Event) => {
        setSelectedEvent(event);
        loadTickets(event.id);
    };

    // Email Check-in Handler
    const handleEmailCheckin = async () => {
        if (!emailInput.trim()) {
            showWarning('Missing Email', 'Please enter an email address');
            return;
        }
        if (!selectedEvent) {
            showError('Error', 'No event selected');
            return;
        }

        try {
            setEmailCheckinLoading(true);
            const response = await api<any>('/checkin/email', {
                method: 'POST',
                body: JSON.stringify({
                    eventId: selectedEvent.id,
                    email: emailInput.trim().toLowerCase()
                })
            });

            if (response.success) {
                const userName = response.data?.user?.fullName || emailInput;
                if (response.data?.isAlreadyCheckedIn) {
                    showWarning('Already Checked In', `${userName} was already checked in before`);
                } else {
                    showSuccess('Check-in Success!', `${userName} has been checked in`);
                }
                // Refresh tickets list
                loadTickets(selectedEvent.id);
                setShowEmailModal(false);
                setEmailInput('');
            }
        } catch (error: any) {
            showError('Check-in Failed', error.message || 'Failed to check-in by email');
        } finally {
            setEmailCheckinLoading(false);
        }
    };

    // Filter tickets
    const filteredTickets = tickets.filter(ticket => {
        const searchLower = search.toLowerCase();
        const matchesSearch = !search ||
            ticket.user?.fullName?.toLowerCase().includes(searchLower) ||
            ticket.user?.email?.toLowerCase().includes(searchLower) ||
            ticket.user?.studentCode?.toLowerCase().includes(searchLower) ||
            ticket.holderName?.toLowerCase().includes(searchLower);

        const matchesFilter =
            filter === 'ALL' ||
            (filter === 'CHECKED_IN' && ticket.checkedInAt) ||
            (filter === 'NOT_CHECKED_IN' && !ticket.checkedInAt);

        return matchesSearch && matchesFilter;
    });

    const checkedInCount = tickets.filter(t => t.checkedInAt).length;
    const notCheckedInCount = tickets.filter(t => !t.checkedInAt).length;
    const checkInProgress = tickets.length > 0 ? (checkedInCount / tickets.length) * 100 : 0;

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-background justify-center items-center">
                <ActivityIndicator size="large" color={COLORS.success} />
                <Text className="text-text-secondary mt-4">Loading events...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            {/* Header */}
            <View className="px-5 pt-3 pb-4 border-b border-border">
                <View className="flex-row justify-between items-center">
                    <View>
                        <Text className="text-text-secondary text-sm">Staff Portal</Text>
                        <Text className="text-text text-xl font-bold">Event Attendees</Text>
                    </View>
                    <View className="flex-row">
                        {/* Email Check-in Button */}
                        <TouchableOpacity
                            className="w-10 h-10 bg-primary rounded-xl items-center justify-center mr-2"
                            onPress={() => setShowEmailModal(true)}
                            style={{
                                shadowColor: COLORS.primary,
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.3,
                                shadowRadius: 4,
                            }}
                        >
                            <Mail size={18} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="w-10 h-10 bg-card border border-border rounded-xl items-center justify-center"
                            onPress={onRefresh}
                        >
                            <RefreshCw size={18} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Email Check-in Modal */}
            <Modal
                visible={showEmailModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowEmailModal(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-6">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-text text-xl font-bold">Email Check-in</Text>
                            <TouchableOpacity onPress={() => setShowEmailModal(false)}>
                                <X size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-text-secondary mb-3">
                            Enter attendee's email to check them in manually
                        </Text>

                        <View
                            className="flex-row items-center rounded-2xl px-4 h-14 mb-4"
                            style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }}
                        >
                            <Mail size={20} color="#94A3B8" />
                            <TextInput
                                className="flex-1 ml-3 text-text text-base"
                                placeholder="attendee@fpt.edu.vn"
                                placeholderTextColor="#94A3B8"
                                value={emailInput}
                                onChangeText={setEmailInput}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                autoFocus
                            />
                        </View>

                        <TouchableOpacity
                            className="h-14 rounded-2xl flex-row items-center justify-center"
                            style={{
                                backgroundColor: COLORS.success,
                                shadowColor: COLORS.success,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                            }}
                            onPress={handleEmailCheckin}
                            disabled={emailCheckinLoading}
                        >
                            {emailCheckinLoading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <CheckCircle size={20} color="#FFF" />
                                    <Text className="text-white font-bold text-base ml-2">Check-in</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <View className="h-8" />
                    </View>
                </View>
            </Modal>

            {events.length === 0 ? (
                <View className="flex-1 justify-center items-center p-8">
                    <View className="w-20 h-20 bg-primary-soft rounded-full items-center justify-center mb-4">
                        <Calendar size={40} color={COLORS.primary} />
                    </View>
                    <Text className="text-text font-bold text-lg mb-2">No Events</Text>
                    <Text className="text-text-secondary text-center">
                        You haven't been assigned as staff to any events yet.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredTickets}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.success} />
                    }
                    ListHeaderComponent={() => (
                        <View>
                            {/* Event Selector */}
                            <View className="px-5 py-4">
                                <Text className="text-text-secondary text-sm mb-3">Select Event</Text>
                                <FlatList
                                    data={events}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    keyExtractor={(item) => item.id}
                                    renderItem={({ item }) => {
                                        const isSelected = selectedEvent?.id === item.id;
                                        return (
                                            <TouchableOpacity
                                                className={`mr-3 p-3 rounded-2xl border ${isSelected ? 'bg-success border-success' : 'bg-card border-border'}`}
                                                style={{ minWidth: 140 }}
                                                onPress={() => selectEvent(item)}
                                            >
                                                <Text
                                                    className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-text'}`}
                                                    numberOfLines={1}
                                                >
                                                    {item.title}
                                                </Text>
                                                <View className="flex-row items-center mt-2">
                                                    <Ticket size={12} color={isSelected ? '#FFF' : COLORS.textSecondary} />
                                                    <Text className={`text-xs ml-1 ${isSelected ? 'text-white/80' : 'text-text-secondary'}`}>
                                                        {item._count?.tickets || 0} attendees
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    }}
                                />
                            </View>

                            {/* Selected Event Info */}
                            {selectedEvent && (
                                <View className="mx-5 bg-card border border-border rounded-2xl p-4 mb-4">
                                    <View className="flex-row items-center">
                                        <View className="w-12 h-12 bg-success-soft rounded-xl items-center justify-center mr-3">
                                            <Calendar size={22} color={COLORS.success} />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-text font-bold text-base" numberOfLines={1}>
                                                {selectedEvent.title}
                                            </Text>
                                            <View className="flex-row items-center mt-1">
                                                <Clock size={12} color={COLORS.textSecondary} />
                                                <Text className="text-text-secondary text-xs ml-1">
                                                    {selectedEvent.startTime
                                                        ? new Date(selectedEvent.startTime).toLocaleDateString('vi-VN', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })
                                                        : 'TBA'
                                                    }
                                                </Text>
                                                {selectedEvent.location && (
                                                    <>
                                                        <Text className="text-text-secondary mx-1">•</Text>
                                                        <MapPin size={12} color={COLORS.textSecondary} />
                                                        <Text className="text-text-secondary text-xs ml-1">{selectedEvent.location}</Text>
                                                    </>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            )}

                            {/* Enhanced Stats with Progress Bar */}
                            <View className="mx-5 bg-card border border-border rounded-2xl p-4 mb-4">
                                {/* Progress Header */}
                                <View className="flex-row justify-between items-center mb-3">
                                    <Text className="text-text font-bold text-base">Check-in Progress</Text>
                                    <View className="flex-row items-center">
                                        <Text className="text-success font-bold text-lg">{checkedInCount}</Text>
                                        <Text className="text-text-secondary text-lg">/{tickets.length}</Text>
                                    </View>
                                </View>

                                {/* Progress Bar */}
                                <View className="h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
                                    <View
                                        className="h-full bg-success rounded-full"
                                        style={{ width: `${checkInProgress}%` }}
                                    />
                                </View>

                                {/* Stats Row */}
                                <View className="flex-row">
                                    <View className="flex-1 flex-row items-center">
                                        <View className="w-3 h-3 bg-success rounded-full mr-2" />
                                        <Text className="text-text-secondary text-sm">Checked: {checkedInCount}</Text>
                                    </View>
                                    <View className="flex-1 flex-row items-center">
                                        <View className="w-3 h-3 bg-warning rounded-full mr-2" />
                                        <Text className="text-text-secondary text-sm">Waiting: {notCheckedInCount}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Search */}
                            <View className="mx-5 mb-4">
                                <View className="flex-row items-center bg-card border border-border rounded-xl px-4 h-12">
                                    <Search size={18} color={COLORS.textSecondary} />
                                    <TextInput
                                        className="flex-1 ml-3 text-text"
                                        placeholder="Search attendees..."
                                        placeholderTextColor="#94A3B8"
                                        value={search}
                                        onChangeText={setSearch}
                                    />
                                </View>
                            </View>

                            {/* Filter Tabs */}
                            <View className="flex-row mx-5 mb-4">
                                {[
                                    { key: 'ALL', label: 'All', count: tickets.length },
                                    { key: 'CHECKED_IN', label: 'Checked In', count: checkedInCount },
                                    { key: 'NOT_CHECKED_IN', label: 'Waiting', count: notCheckedInCount },
                                ].map(tab => (
                                    <TouchableOpacity
                                        key={tab.key}
                                        className={`flex-1 py-2.5 rounded-xl mr-2 items-center ${filter === tab.key ? 'bg-success' : 'bg-card border border-border'}`}
                                        onPress={() => setFilter(tab.key as any)}
                                    >
                                        <Text className={`text-xs font-bold ${filter === tab.key ? 'text-white' : 'text-text-secondary'}`}>
                                            {tab.label} ({tab.count})
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Loading Tickets */}
                            {loadingTickets && (
                                <View className="mx-5 py-8 items-center">
                                    <ActivityIndicator size="small" color={COLORS.success} />
                                    <Text className="text-text-secondary mt-2">Loading attendees...</Text>
                                </View>
                            )}
                        </View>
                    )}
                    renderItem={({ item: ticket }) => (
                        <View className="mx-5 mb-3 bg-card border border-border rounded-xl p-4">
                            <View className="flex-row items-center">
                                <View className={`w-12 h-12 rounded-xl items-center justify-center mr-3 ${ticket.checkedInAt ? 'bg-success-soft' : 'bg-gray-100'}`}>
                                    {ticket.checkedInAt ? (
                                        <CheckCircle size={22} color={COLORS.success} />
                                    ) : (
                                        <User size={22} color={COLORS.textSecondary} />
                                    )}
                                </View>
                                <View className="flex-1">
                                    <Text className="text-text font-bold text-base">
                                        {ticket.user?.fullName || ticket.holderName || 'Unknown'}
                                    </Text>
                                    <Text className="text-text-secondary text-sm">
                                        {ticket.user?.studentCode || ticket.user?.email || 'No info'}
                                    </Text>
                                </View>
                                <View>
                                    {ticket.checkedInAt ? (
                                        <View className="bg-success-soft px-3 py-1.5 rounded-lg">
                                            <Text className="text-success text-xs font-bold">✓ In</Text>
                                        </View>
                                    ) : (
                                        <View className="bg-gray-100 px-3 py-1.5 rounded-lg">
                                            <Text className="text-text-secondary text-xs font-bold">Waiting</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                            {ticket.checkedInAt && (
                                <View className="mt-2 pt-2 border-t border-border flex-row items-center">
                                    <Clock size={12} color={COLORS.success} />
                                    <Text className="text-success text-xs ml-1">
                                        Checked in at {new Date(ticket.checkedInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                    ListEmptyComponent={() => (
                        !loadingTickets && (
                            <View className="mx-5 py-12 items-center">
                                <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-3">
                                    <Users size={32} color={COLORS.textSecondary} />
                                </View>
                                <Text className="text-text font-bold">No attendees found</Text>
                                <Text className="text-text-secondary text-sm text-center mt-1">
                                    {search ? 'Try a different search term' : 'No tickets for this event yet'}
                                </Text>
                            </View>
                        )
                    )}
                    contentContainerStyle={{ paddingBottom: 120 }}
                />
            )}
        </SafeAreaView>
    );
}
