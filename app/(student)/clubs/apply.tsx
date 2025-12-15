import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle, Send } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/theme';
import { clubService } from '../../../services/club.service';

export default function ClubApplication() {
    const { clubId, clubName, fee } = useLocalSearchParams();
    const router = useRouter();
    const [reason, setReason] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!reason.trim()) {
            Alert.alert('Required', 'Please tell us why you want to join');
            return;
        }

        try {
            setLoading(true);
            await clubService.applyToClub(clubId as string, reason);
            setSubmitted(true);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to submit application');
        } finally {
            setLoading(false);
        }
    };

    // Success State
    if (submitted) {
        const feeAmount = Number(fee) || 0;
        return (
            <SafeAreaView className="flex-1 bg-background justify-center items-center p-6">
                <View className="bg-success-soft w-24 h-24 rounded-full items-center justify-center mb-6">
                    <CheckCircle size={48} color={COLORS.success} />
                </View>
                <Text className="text-text text-2xl font-bold mb-2 text-center">Application Sent!</Text>
                <Text className="text-text-secondary text-center mb-2">
                    Your application to <Text className="font-bold">{clubName}</Text> has been submitted.
                </Text>
                {feeAmount > 0 && (
                    <Text className="text-text-secondary text-center mb-6">
                        Membership fee: <Text className="text-primary font-bold">{feeAmount.toLocaleString()}₫</Text>
                    </Text>
                )}
                <TouchableOpacity
                    className="bg-primary px-8 py-4 rounded-xl w-full items-center"
                    onPress={() => router.navigate('/(student)/clubs')}
                >
                    <Text className="text-white font-bold">Back to Clubs</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            {/* Header */}
            <View className="flex-row items-center px-5 py-4 bg-card border-b border-border">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <ArrowLeft size={24} color={COLORS.text} />
                </TouchableOpacity>
                <View className="flex-1">
                    <Text className="text-text text-lg font-bold" numberOfLines={1}>Apply to Join</Text>
                    <Text className="text-text-secondary text-sm" numberOfLines={1}>{clubName}</Text>
                </View>
            </View>

            <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
                {/* Info Card */}
                <View className="bg-secondary-soft border border-secondary/20 rounded-xl p-4 mb-6">
                    <Text className="text-secondary font-medium text-sm">
                        📝 The club leader will review your application. You'll be notified once it's approved.
                    </Text>
                </View>

                {/* Form */}
                <View className="bg-card border border-border rounded-xl p-5">
                    <Text className="text-text font-bold text-base mb-4">Why do you want to join?</Text>

                    <TextInput
                        className="bg-background border border-border rounded-xl p-4 text-text min-h-[150px]"
                        placeholder="Share your interests, skills, and what you hope to contribute..."
                        placeholderTextColor="#94A3B8"
                        multiline
                        textAlignVertical="top"
                        value={reason}
                        onChangeText={setReason}
                    />

                    <Text className="text-text-secondary text-xs mt-2 mb-6">
                        Write at least a few sentences to help the club leader understand your motivation.
                    </Text>

                    <TouchableOpacity
                        className="w-full bg-primary py-4 rounded-xl items-center flex-row justify-center"
                        onPress={handleSubmit}
                        disabled={loading}
                        style={{ opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Send size={20} color="#FFF" />
                                <Text className="text-white font-bold ml-2">Submit Application</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
