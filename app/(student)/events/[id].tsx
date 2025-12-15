import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Clock, Heart, MapPin, Share2, Ticket, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/theme';
import { Event, eventService } from '../../../services/event.service';

const { width } = Dimensions.get('window');

export default function EventDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) loadEventDetail();
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

    return (
        <View className="flex-1 bg-background">
            {/* Hero Image */}
            <View className="relative">
                <Image
                    source={{ uri: event.club?.logoUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800' }}
                    style={{ width, height: 280 }}
                    resizeMode="cover"
                />
                <View className="absolute inset-0 bg-black/30" />

                {/* Header Buttons */}
                <SafeAreaView className="absolute top-0 left-0 right-0 px-4 pt-2">
                    <View className="flex-row justify-between items-center">
                        <TouchableOpacity
                            className="w-11 h-11 bg-white/90 rounded-xl items-center justify-center"
                            onPress={() => router.back()}
                        >
                            <ArrowLeft size={22} color={COLORS.text} />
                        </TouchableOpacity>
                        <View className="flex-row">
                            <TouchableOpacity className="w-11 h-11 bg-white/90 rounded-xl items-center justify-center mr-2">
                                <Heart size={20} color={COLORS.text} />
                            </TouchableOpacity>
                            <TouchableOpacity className="w-11 h-11 bg-white/90 rounded-xl items-center justify-center">
                                <Share2 size={20} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>

                {/* Price Badge */}
                <View className="absolute bottom-4 left-4">
                    <View className={`px-4 py-2 rounded-xl ${isFree ? 'bg-success' : 'bg-primary'}`}>
                        <Text className="text-white font-bold text-lg">
                            {isFree ? 'FREE' : `${price.toLocaleString()}₫`}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Content */}
            <ScrollView
                className="flex-1 -mt-6 bg-background rounded-t-3xl"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                <View className="px-5 pt-6">
                    {/* Title & Club */}
                    <View className="flex-row items-start justify-between mb-4">
                        <View className="flex-1 mr-4">
                            <Text className="text-text text-2xl font-bold mb-2">{event.title}</Text>
                            <TouchableOpacity className="flex-row items-center">
                                <View className="w-8 h-8 bg-secondary-soft rounded-full items-center justify-center mr-2">
                                    <Text className="text-secondary font-bold text-sm">
                                        {event.club?.name?.charAt(0) || 'C'}
                                    </Text>
                                </View>
                                <Text className="text-secondary font-medium">{event.club?.name}</Text>
                            </TouchableOpacity>
                        </View>
                        {event.type === 'INTERNAL' && (
                            <View className="bg-warning-soft px-3 py-1.5 rounded-xl">
                                <Text className="text-warning font-bold text-xs">MEMBERS</Text>
                            </View>
                        )}
                    </View>

                    {/* Info Cards */}
                    <View className="bg-card border border-border rounded-2xl p-4 mb-5">
                        <View className="flex-row mb-4">
                            <View className="flex-1 flex-row items-center">
                                <View className="w-12 h-12 bg-primary-soft rounded-xl items-center justify-center mr-3">
                                    <Calendar size={22} color={COLORS.primary} />
                                </View>
                                <View>
                                    <Text className="text-text-secondary text-xs">Date</Text>
                                    <Text className="text-text font-semibold">
                                        {event.startTime
                                            ? new Date(event.startTime).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'short' })
                                            : 'TBA'}
                                    </Text>
                                </View>
                            </View>
                            <View className="flex-1 flex-row items-center">
                                <View className="w-12 h-12 bg-secondary-soft rounded-xl items-center justify-center mr-3">
                                    <Clock size={22} color={COLORS.secondary} />
                                </View>
                                <View>
                                    <Text className="text-text-secondary text-xs">Time</Text>
                                    <Text className="text-text font-semibold">
                                        {event.startTime
                                            ? new Date(event.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                                            : 'TBA'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <View className="flex-row items-center">
                            <View className="w-12 h-12 bg-info-soft rounded-xl items-center justify-center mr-3">
                                <MapPin size={22} color={COLORS.info} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-text-secondary text-xs">Location</Text>
                                <Text className="text-text font-semibold">{event.location || 'To be announced'}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Capacity */}
                    {event.capacity && (
                        <View className="bg-card border border-border rounded-2xl p-4 mb-5 flex-row items-center">
                            <View className="w-12 h-12 bg-success-soft rounded-xl items-center justify-center mr-3">
                                <Ticket size={22} color={COLORS.success} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-text-secondary text-xs">Availability</Text>
                                <Text className="text-text font-semibold">
                                    {(event.capacity - (event._count?.tickets || 0))} spots left
                                </Text>
                            </View>
                            <View className="items-end">
                                <Text className="text-text-secondary text-xs">Capacity</Text>
                                <Text className="text-text font-semibold">{event.capacity}</Text>
                            </View>
                        </View>
                    )}

                    {/* Description */}
                    <View className="mb-6">
                        <Text className="text-text font-bold text-lg mb-3">About Event</Text>
                        <Text className="text-text-secondary leading-6">
                            {event.description || 'No description available for this event. Check back later for more details!'}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom CTA */}
            <View className="absolute bottom-0 left-0 right-0 bg-card border-t border-border px-5 pt-4 pb-8">
                <TouchableOpacity
                    className={`w-full py-4 rounded-2xl items-center flex-row justify-center ${isFree ? 'bg-success' : 'bg-primary'}`}
                    onPress={() => router.push({
                        pathname: '/(student)/payment',
                        params: { eventId: event.id, eventTitle: event.title, amount: price, isFree: isFree ? 'true' : 'false' }
                    })}
                >
                    <Ticket size={20} color="#FFF" />
                    <Text className="text-white font-bold text-base ml-2">
                        {isFree ? 'Register Now - Free' : `Get Ticket - ${price.toLocaleString()}₫`}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
