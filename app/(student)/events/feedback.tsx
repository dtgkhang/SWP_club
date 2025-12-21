import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MessageSquare, Send, Star } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/theme';
import { useToast } from '../../../contexts/ToastContext';
import { Event, eventService } from '../../../services/event.service';

export default function EventFeedbackScreen() {
    const router = useRouter();
    const { id: eventId } = useLocalSearchParams<{ id: string }>();
    const { showSuccess, showError } = useToast();

    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [existingFeedback, setExistingFeedback] = useState<any>(null);

    // Reset state and load data when eventId changes
    useEffect(() => {
        // Reset state for new event
        setEvent(null);
        setLoading(true);
        setSubmitting(false);
        setRating(0);
        setComment('');
        setExistingFeedback(null);

        loadData();
    }, [eventId]);

    const loadData = async () => {
        try {
            setLoading(true);
            if (!eventId) return;

            const [eventData, feedbacksResponse]: [Event | null, any] = await Promise.all([
                eventService.getEventDetail(eventId),
                eventService.getEventFeedbacks(eventId).catch(() => [])
            ]);

            setEvent(eventData);

            // Ensure feedbacks is an array (BE might return object with data property)
            const feedbacks = Array.isArray(feedbacksResponse)
                ? feedbacksResponse
                : (feedbacksResponse?.data || feedbacksResponse?.feedbacks || []);

            // Find user's own feedback (marked with isOwn or by matching userId)
            const myFeedback = Array.isArray(feedbacks) ? feedbacks.find((f: any) => f.isOwn) : null;
            if (myFeedback) {
                setExistingFeedback(myFeedback);
                setRating(myFeedback.rating || 0);
                setComment(myFeedback.comment || '');
            }
        } catch (error) {
            console.log('Error loading event:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Rating Required', 'Please select a star rating before submitting.');
            return;
        }

        try {
            setSubmitting(true);
            await eventService.submitFeedback(eventId!, rating, comment || undefined);
            showSuccess(existingFeedback ? 'Feedback updated!' : 'Thank you for your feedback!');
            router.back();
        } catch (error: any) {
            showError(error?.message || 'Failed to submit feedback');
        } finally {
            setSubmitting(false);
        }
    };

    const StarButton = ({ value }: { value: number }) => {
        const isSelected = value <= rating;
        return (
            <TouchableOpacity
                onPress={() => setRating(value)}
                className="p-2"
                activeOpacity={0.7}
            >
                <Star
                    size={40}
                    color={isSelected ? '#FBBF24' : COLORS.border}
                    fill={isSelected ? '#FBBF24' : 'transparent'}
                />
            </TouchableOpacity>
        );
    };

    const getRatingText = () => {
        switch (rating) {
            case 1: return '😞 Poor';
            case 2: return '😐 Fair';
            case 3: return '🙂 Good';
            case 4: return '😊 Great';
            case 5: return '🤩 Amazing!';
            default: return 'Tap to rate';
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text className="text-text-secondary mt-4">Loading...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                {/* Header */}
                <View className="flex-row items-center px-5 py-4 border-b border-border">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-card border border-border rounded-xl items-center justify-center mr-4"
                    >
                        <ArrowLeft size={20} color={COLORS.text} />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-text text-lg font-bold">
                            {existingFeedback ? 'Edit Feedback' : 'Rate Event'}
                        </Text>
                        <Text className="text-text-secondary text-sm" numberOfLines={1}>
                            {event?.title || 'Event'}
                        </Text>
                    </View>
                </View>

                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ padding: 20 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Event Info Card */}
                    <View className="bg-card border border-border rounded-2xl p-5 mb-6">
                        <Text className="text-text font-bold text-xl mb-2" numberOfLines={2}>
                            {event?.title}
                        </Text>
                        <Text className="text-text-secondary text-sm">
                            {event?.club?.name}
                        </Text>
                        {event?.startTime && (
                            <Text className="text-text-secondary text-sm mt-1">
                                {new Date(event.startTime).toLocaleDateString('vi-VN', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </Text>
                        )}
                    </View>

                    {/* Star Rating */}
                    <View className="bg-card border border-border rounded-2xl p-6 mb-6 items-center">
                        <Text className="text-text font-bold text-lg mb-4">How was your experience?</Text>

                        <View className="flex-row items-center justify-center mb-4">
                            {[1, 2, 3, 4, 5].map(value => (
                                <StarButton key={value} value={value} />
                            ))}
                        </View>

                        <View
                            className={`px-5 py-2 rounded-full ${rating > 0 ? 'bg-primary-soft' : 'bg-border/30'}`}
                        >
                            <Text className={`text-base font-bold ${rating > 0 ? 'text-primary' : 'text-text-secondary'}`}>
                                {getRatingText()}
                            </Text>
                        </View>
                    </View>

                    {/* Comment Section */}
                    <View className="bg-card border border-border rounded-2xl p-5 mb-6">
                        <View className="flex-row items-center mb-3">
                            <MessageSquare size={20} color={COLORS.primary} />
                            <Text className="text-text font-bold text-base ml-2">Additional Comments</Text>
                            <Text className="text-text-secondary text-sm ml-2">(Optional)</Text>
                        </View>

                        <TextInput
                            className="bg-background border border-border rounded-xl p-4 text-text min-h-[120px]"
                            placeholder="Share your thoughts about the event..."
                            placeholderTextColor={COLORS.textSecondary}
                            multiline
                            textAlignVertical="top"
                            value={comment}
                            onChangeText={setComment}
                            maxLength={500}
                        />

                        <Text className="text-text-secondary text-xs text-right mt-2">
                            {comment.length}/500
                        </Text>
                    </View>

                    {/* Tips */}
                    <View className="bg-primary-soft rounded-xl p-4 mb-6">
                        <Text className="text-primary text-sm font-medium">
                            💡 Your feedback helps event organizers improve future events and is greatly appreciated!
                        </Text>
                    </View>
                </ScrollView>

                {/* Submit Button */}
                <View className="px-5 pb-5 pt-3 border-t border-border bg-background">
                    <TouchableOpacity
                        className={`py-4 rounded-xl flex-row items-center justify-center ${rating > 0 ? 'bg-primary' : 'bg-gray-300'}`}
                        onPress={handleSubmit}
                        disabled={submitting || rating === 0}
                        style={rating > 0 ? {
                            shadowColor: COLORS.primary,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                        } : {}}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Send size={20} color="#FFF" />
                                <Text className="text-white font-bold text-base ml-2">
                                    {existingFeedback ? 'Update Feedback' : 'Submit Feedback'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
