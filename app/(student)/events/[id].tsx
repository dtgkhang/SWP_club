import { Image } from 'expo-image';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, CheckCircle, ChevronRight, Clock, Heart, MapPin, Share2, Sparkles, Ticket, Users, Video, Wifi } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/theme';
import { Event, eventService } from '../../../services/event.service';

const { width } = Dimensions.get('window');

export default function EventDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasRegistered, setHasRegistered] = useState(false);
    const [checkingRegistration, setCheckingRegistration] = useState(true);
    const [userTicket, setUserTicket] = useState<any>(null);

    useEffect(() => {
        if (id) {
            loadEventDetail();
            checkRegistration();
        }
    }, [id]);

    const loadEventDetail = async () => {
        try {
            setLoading(true);
            const data = await eventService.getEventDetail(id as string);
            setEvent(data);
        } catch (error) {
            console.error('Error loading event:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkRegistration = async () => {
        try {
            setCheckingRegistration(true);
            const tickets = await eventService.getMyTickets();
            const existingTicket = tickets.find((t: any) =>
                t.event?.id === id && ['PAID', 'USED'].includes(t.status)
            );
            if (existingTicket) {
                setHasRegistered(true);
                setUserTicket(existingTicket);
            }
        } catch (error) {
            console.log('Error checking registration:', error);
        } finally {
            setCheckingRegistration(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 bg-background justify-center items-center">
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!event) {
        return (
            <View className="flex-1 bg-background justify-center items-center">
                <Text className="text-text-secondary">Event not found</Text>
            </View>
        );
    }

    const price = event.price ?? 0;
    const isFree = event.pricingType === 'FREE' || price === 0;
    const isOnline = event.format === 'ONLINE';
    const spotsLeft = event.capacity ? event.capacity - (event._count?.tickets || 0) : null;
    const isSoldOut = spotsLeft !== null && spotsLeft <= 0;

    return (
        <View className="flex-1 bg-background">
            {/* Hero Image */}
            <View className="relative">
                <Image
                    source={{ uri: event.club?.logoUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800' }}
                    style={{ width, height: 300 }}
                    contentFit="cover"
                    transition={300}
                />
                {/* Gradient Overlay */}
                <View className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} />

                {/* Header Buttons */}
                <SafeAreaView className="absolute top-0 left-0 right-0 px-4 pt-2">
                    <View className="flex-row justify-between items-center">
                        <TouchableOpacity
                            className="w-11 h-11 bg-white/95 rounded-2xl items-center justify-center"
                            onPress={() => router.back()}
                            style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 4,
                            }}
                        >
                            <ArrowLeft size={22} color={COLORS.text} />
                        </TouchableOpacity>
                        <View className="flex-row">
                            <TouchableOpacity
                                className="w-11 h-11 bg-white/95 rounded-2xl items-center justify-center mr-2"
                                style={{
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 4,
                                }}
                            >
                                <Heart size={20} color={COLORS.text} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="w-11 h-11 bg-white/95 rounded-2xl items-center justify-center"
                                style={{
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 4,
                                }}
                            >
                                <Share2 size={20} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>

                {/* Badges - Bottom Left */}
                <View className="absolute bottom-4 left-4 flex-row">
                    {/* Price/Status Badge */}
                    <View
                        className={`px-4 py-2 rounded-2xl mr-2 ${hasRegistered ? 'bg-success' : isFree ? 'bg-success' : 'bg-primary'}`}
                        style={{
                            shadowColor: hasRegistered || isFree ? COLORS.success : COLORS.primary,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                        }}
                    >
                        <Text className="text-white font-bold text-lg">
                            {hasRegistered ? '✓ Registered' : isFree ? 'FREE' : `${price.toLocaleString()}₫`}
                        </Text>
                    </View>
                    {/* Format Badge */}
                    <View className="bg-white/90 px-3 py-2 rounded-2xl flex-row items-center">
                        {isOnline ? <Wifi size={14} color={COLORS.secondary} /> : <MapPin size={14} color={COLORS.info} />}
                        <Text className="text-text font-bold text-sm ml-1.5">{isOnline ? 'Online' : 'Offline'}</Text>
                    </View>
                </View>
            </View>

            {/* Content */}
            <ScrollView
                className="flex-1 -mt-6 bg-background rounded-t-[32px]"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 140 }}
            >
                <View className="px-5 pt-6">
                    {/* Title */}
                    <Text className="text-text text-2xl font-bold mb-3">{event.title}</Text>

                    {/* Club Card - Clickable */}
                    <Link
                        href={{
                            pathname: '/(student)/clubs/[id]',
                            params: { id: event.club?.slug || event.club?.id || '' }
                        }}
                        asChild
                    >
                        <TouchableOpacity
                            className="bg-card border border-border rounded-2xl p-4 mb-5 flex-row items-center"
                            activeOpacity={0.8}
                            style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.05,
                                shadowRadius: 8,
                            }}
                        >
                            <Image
                                source={{ uri: event.club?.logoUrl || 'https://via.placeholder.com/100' }}
                                style={{ width: 48, height: 48, borderRadius: 12 }}
                                contentFit="cover"
                            />
                            <View className="flex-1 ml-3">
                                <Text className="text-text-secondary text-xs mb-0.5">Organized by</Text>
                                <Text className="text-text font-bold text-base">{event.club?.name || 'Unknown Club'}</Text>
                            </View>
                            <View className="bg-primary-soft px-3 py-2 rounded-xl flex-row items-center">
                                <Text className="text-primary font-bold text-sm">View</Text>
                                <ChevronRight size={16} color={COLORS.primary} />
                            </View>
                        </TouchableOpacity>
                    </Link>

                    {/* Tags Row */}
                    <View className="flex-row flex-wrap mb-5">
                        {event.type === 'INTERNAL' && (
                            <View className="bg-warning-soft px-3 py-1.5 rounded-full mr-2 mb-2 flex-row items-center">
                                <Users size={12} color={COLORS.warning} />
                                <Text className="text-warning font-bold text-xs ml-1.5">Members Only</Text>
                            </View>
                        )}
                        {event.pricingType === 'PAID' && (
                            <View className="bg-primary-soft px-3 py-1.5 rounded-full mr-2 mb-2 flex-row items-center">
                                <Ticket size={12} color={COLORS.primary} />
                                <Text className="text-primary font-bold text-xs ml-1.5">Paid Event</Text>
                            </View>
                        )}
                        {spotsLeft !== null && spotsLeft < 20 && spotsLeft > 0 && (
                            <View className="bg-error-soft px-3 py-1.5 rounded-full mr-2 mb-2 flex-row items-center">
                                <Sparkles size={12} color={COLORS.error} />
                                <Text className="text-error font-bold text-xs ml-1.5">Only {spotsLeft} left!</Text>
                            </View>
                        )}
                    </View>

                    {/* Info Cards - Grid */}
                    <View className="mb-5">
                        <View className="flex-row mb-3">
                            {/* Date Card */}
                            <View
                                className="flex-1 bg-card border border-border rounded-2xl p-4 mr-2"
                                style={{
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.03,
                                    shadowRadius: 4,
                                }}
                            >
                                <View className="w-10 h-10 bg-primary-soft rounded-xl items-center justify-center mb-3">
                                    <Calendar size={20} color={COLORS.primary} />
                                </View>
                                <Text className="text-text-secondary text-xs mb-1">Date</Text>
                                <Text className="text-text font-bold">
                                    {event.startTime
                                        ? new Date(event.startTime).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'short' })
                                        : 'TBA'}
                                </Text>
                            </View>
                            {/* Time Card */}
                            <View
                                className="flex-1 bg-card border border-border rounded-2xl p-4 ml-2"
                                style={{
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.03,
                                    shadowRadius: 4,
                                }}
                            >
                                <View className="w-10 h-10 bg-secondary-soft rounded-xl items-center justify-center mb-3">
                                    <Clock size={20} color={COLORS.secondary} />
                                </View>
                                <Text className="text-text-secondary text-xs mb-1">Time</Text>
                                <Text className="text-text font-bold">
                                    {event.startTime
                                        ? new Date(event.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                                        : 'TBA'}
                                </Text>
                            </View>
                        </View>
                        {/* Location Card */}
                        <View
                            className="bg-card border border-border rounded-2xl p-4 flex-row items-center"
                            style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.03,
                                shadowRadius: 4,
                            }}
                        >
                            <View className="w-12 h-12 bg-info-soft rounded-xl items-center justify-center mr-4">
                                {isOnline ? <Video size={22} color={COLORS.info} /> : <MapPin size={22} color={COLORS.info} />}
                            </View>
                            <View className="flex-1">
                                <Text className="text-text-secondary text-xs mb-1">Location</Text>
                                <Text className="text-text font-bold">
                                    {isOnline ? 'Online Event' : (event.location || 'To be announced')}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Capacity Progress */}
                    {event.capacity && (
                        <View className="bg-card border border-border rounded-2xl p-4 mb-5">
                            <View className="flex-row items-center justify-between mb-3">
                                <View className="flex-row items-center">
                                    <View className="w-10 h-10 bg-success-soft rounded-xl items-center justify-center mr-3">
                                        <Ticket size={20} color={COLORS.success} />
                                    </View>
                                    <View>
                                        <Text className="text-text-secondary text-xs">Availability</Text>
                                        <Text className="text-text font-bold">
                                            {isSoldOut ? 'Sold Out!' : `${spotsLeft} spots left`}
                                        </Text>
                                    </View>
                                </View>
                                <Text className="text-text-secondary text-sm">
                                    {event._count?.tickets || 0}/{event.capacity}
                                </Text>
                            </View>
                            {/* Progress Bar */}
                            <View className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <View
                                    className={`h-full rounded-full ${isSoldOut ? 'bg-error' : 'bg-success'}`}
                                    style={{ width: `${Math.min(((event._count?.tickets || 0) / event.capacity) * 100, 100)}%` }}
                                />
                            </View>
                        </View>
                    )}

                    {/* Description */}
                    <View className="mb-6">
                        <Text className="text-text font-bold text-lg mb-3">About This Event</Text>
                        <Text className="text-text-secondary leading-6">
                            {event.description || 'No description available for this event. Check back later for more details!'}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom CTA */}
            {!checkingRegistration && (
                <View
                    className="absolute bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border px-5 pt-4 pb-8"
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 12,
                    }}
                >
                    {hasRegistered ? (
                        // Mini Ticket Card
                        <TouchableOpacity
                            className="bg-primary/5 border border-primary/20 rounded-2xl overflow-hidden"
                            onPress={() => router.push('/(student)/wallet')}
                            activeOpacity={0.9}
                        >
                            <View className="p-4 flex-row items-center">
                                {/* QR Preview or Online Icon */}
                                <View className="bg-white p-2 rounded-xl mr-4 border border-border">
                                    {(isOnline || !userTicket?.qrCode) ? (
                                        <View className="w-12 h-12 items-center justify-center">
                                            {isOnline ? (
                                                <Video size={32} color={COLORS.primary} />
                                            ) : (
                                                <Ticket size={32} color={COLORS.primary} />
                                            )}
                                        </View>
                                    ) : (
                                        <Image
                                            source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(userTicket.qrCode)}` }}
                                            style={{ width: 48, height: 48 }}
                                        />
                                    )}
                                </View>

                                {/* Ticket Info */}
                                <View className="flex-1">
                                    <View className="flex-row items-center justify-between mb-1">
                                        <Text className="text-primary font-bold text-base">You're Going!</Text>
                                        <View className="bg-success px-2 py-0.5 rounded-md">
                                            <Text className="text-white text-[10px] font-bold">CONFIRMED</Text>
                                        </View>
                                    </View>
                                    <Text className="text-text-secondary text-xs mb-1">
                                        Ticket: <Text className="font-mono text-text font-medium">{(userTicket?.qrCode || userTicket?.id)?.substring(0, 8).toUpperCase() || 'XXXXXX'}</Text>
                                    </Text>
                                    <View className="flex-row items-center">
                                        <Text className="text-primary font-semibold text-sm">Open Wallet</Text>
                                        <ChevronRight size={14} color={COLORS.primary} />
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ) : (
                        // Register Button
                        <TouchableOpacity
                            className={`w-full py-4 rounded-2xl items-center flex-row justify-center ${isSoldOut ? 'bg-gray-300' : isFree ? 'bg-success' : 'bg-primary'}`}
                            onPress={() => !isSoldOut && router.push({
                                pathname: '/(student)/payment',
                                params: { eventId: event.id, eventTitle: event.title, amount: price, isFree: isFree ? 'true' : 'false' }
                            })}
                            disabled={isSoldOut}
                            style={!isSoldOut ? {
                                shadowColor: isFree ? COLORS.success : COLORS.primary,
                                shadowOffset: { width: 0, height: 6 },
                                shadowOpacity: 0.35,
                                shadowRadius: 12,
                            } : {}}
                        >
                            {isSoldOut ? (
                                <Text className="text-white font-bold text-base">Sold Out</Text>
                            ) : (
                                <>
                                    <Ticket size={20} color="#FFF" />
                                    <Text className="text-white font-bold text-base ml-2">
                                        {isFree ? 'Register Now - Free' : `Get Ticket - ${price.toLocaleString()}₫`}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}
