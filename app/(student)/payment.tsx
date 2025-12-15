import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle, ExternalLink, XCircle } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { eventService } from '../../services/event.service';

export default function PaymentScreen() {
    const { eventId, eventTitle, amount, isFree } = useLocalSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'PENDING' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('PENDING');
    const [tickets, setTickets] = useState<any[]>([]);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (isFree === 'true') {
            handleFreeRegistration();
        }
    }, [isFree]);

    const handleFreeRegistration = async () => {
        try {
            setStatus('PROCESSING');
            const result = await eventService.registerEvent(eventId as string, 1);
            if (result.tickets) {
                setTickets(result.tickets);
            }
            setStatus('SUCCESS');
        } catch (error: any) {
            setErrorMessage(error.message || 'Registration failed');
            setStatus('ERROR');
        }
    };

    const handlePaidRegistration = async () => {
        try {
            setStatus('PROCESSING');
            const result = await eventService.registerEvent(eventId as string, 1);

            if (result.type === 'PAID' && result.paymentLink) {
                await Linking.openURL(result.paymentLink);
                Alert.alert(
                    'Payment Link Opened',
                    'Complete your payment in the browser. Your ticket will appear in your wallet.',
                    [{ text: 'OK', onPress: () => router.replace('/(student)/wallet') }]
                );
            } else if (result.tickets) {
                setTickets(result.tickets);
                setStatus('SUCCESS');
            }
        } catch (error: any) {
            setErrorMessage(error.message || 'Registration failed');
            setStatus('ERROR');
        }
    };

    // Success State
    if (status === 'SUCCESS') {
        return (
            <SafeAreaView className="flex-1 bg-background justify-center items-center p-6">
                <View className="bg-success-soft w-24 h-24 rounded-full items-center justify-center mb-6">
                    <CheckCircle size={48} color={COLORS.success} />
                </View>
                <Text className="text-text text-2xl font-bold mb-2">Registration Successful!</Text>
                <Text className="text-text-secondary text-center mb-6">
                    Your ticket has been added to your wallet.
                </Text>
                {tickets.length > 0 && (
                    <View className="bg-card border border-border rounded-xl p-4 mb-6 w-full">
                        <Text className="text-text-secondary text-xs mb-1">QR Code</Text>
                        <Text className="text-text font-mono font-medium">{tickets[0]?.qrCode}</Text>
                    </View>
                )}
                <TouchableOpacity
                    className="bg-primary px-8 py-4 rounded-xl w-full items-center"
                    onPress={() => router.replace('/(student)/wallet')}
                >
                    <Text className="text-white font-bold">View My Tickets</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // Error State
    if (status === 'ERROR') {
        return (
            <SafeAreaView className="flex-1 bg-background justify-center items-center p-6">
                <View className="bg-danger-soft w-24 h-24 rounded-full items-center justify-center mb-6">
                    <XCircle size={48} color={COLORS.error} />
                </View>
                <Text className="text-text text-2xl font-bold mb-2">Registration Failed</Text>
                <Text className="text-text-secondary text-center mb-6">{errorMessage}</Text>
                <TouchableOpacity
                    className="bg-primary px-8 py-4 rounded-xl w-full items-center"
                    onPress={() => router.back()}
                >
                    <Text className="text-white font-bold">Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // Processing State (Free)
    if (isFree === 'true') {
        return (
            <SafeAreaView className="flex-1 bg-background justify-center items-center p-6">
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text className="text-text font-medium mt-4">Registering for event...</Text>
            </SafeAreaView>
        );
    }

    // Payment UI (Paid)
    return (
        <SafeAreaView className="flex-1 bg-background">
            {/* Header */}
            <View className="flex-row items-center px-5 py-4 bg-card border-b border-border">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <ArrowLeft size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text className="text-text text-lg font-bold">Payment</Text>
            </View>

            <View className="flex-1 p-5 justify-center">
                <View className="bg-card border border-border rounded-2xl p-6 items-center">
                    {/* Event Info */}
                    <Text className="text-text-secondary text-sm mb-1">Event</Text>
                    <Text className="text-text font-bold text-lg mb-6 text-center">{eventTitle}</Text>

                    {/* Amount */}
                    <View className="bg-primary-soft rounded-xl px-8 py-4 mb-6">
                        <Text className="text-primary text-3xl font-bold">
                            {Number(amount).toLocaleString()}₫
                        </Text>
                    </View>

                    <Text className="text-text-secondary text-center mb-8">
                        You will be redirected to PayOS to complete your payment securely.
                    </Text>

                    {/* Payment Button */}
                    {status === 'PROCESSING' ? (
                        <View className="w-full bg-border py-4 rounded-xl items-center flex-row justify-center">
                            <ActivityIndicator color={COLORS.textSecondary} />
                            <Text className="text-text-secondary font-bold ml-2">Processing...</Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            className="w-full bg-primary py-4 rounded-xl items-center flex-row justify-center"
                            onPress={handlePaidRegistration}
                        >
                            <ExternalLink size={20} color="#FFF" />
                            <Text className="text-white font-bold ml-2">Proceed to Payment</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}
