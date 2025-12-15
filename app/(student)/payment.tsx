import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle, ExternalLink, RefreshCw, XCircle } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Linking, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { useToast } from '../../contexts/ToastContext';
import { eventService } from '../../services/event.service';
import { transactionService } from '../../services/transaction.service';

export default function PaymentScreen() {
    const { eventId, eventTitle, amount, isFree } = useLocalSearchParams();
    const router = useRouter();
    const { showSuccess, showError, showInfo } = useToast();
    const [status, setStatus] = useState<'PENDING' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('PENDING');
    const [tickets, setTickets] = useState<any[]>([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [transactionId, setTransactionId] = useState<string | null>(null);
    const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
    const pollingInterval = useRef<any>(null);

    useEffect(() => {
        if (isFree === 'true') {
            handleFreeRegistration();
        }

        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        };
    }, [isFree]);

    // Polling Logic
    useEffect(() => {
        if (status === 'PROCESSING' && transactionId) {
            startPolling();
        } else {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        }
    }, [status, transactionId]);

    const startPolling = () => {
        if (pollingInterval.current) clearInterval(pollingInterval.current);

        pollingInterval.current = setInterval(async () => {
            await checkPaymentStatus();
        }, 3000); // Check every 3 seconds
    };

    const checkPaymentStatus = async () => {
        if (!transactionId) return;
        try {
            const transaction = await transactionService.getTransaction(transactionId);
            console.log('Transaction Status:', transaction.status);

            if (transaction.status === 'SUCCESS') {
                if (pollingInterval.current) clearInterval(pollingInterval.current);
                setTickets(transaction.tickets || []);
                setStatus('SUCCESS');
                showSuccess('Payment Successful!', 'Your ticket has been confirmed.');
            } else if (transaction.status === 'FAILED' || transaction.status === 'CANCELLED') {
                if (pollingInterval.current) clearInterval(pollingInterval.current);
                setStatus('ERROR');
                setErrorMessage('Payment was cancelled or failed.');
            }
        } catch (error) {
            console.error('Polling error:', error);
            // Don't stop polling on network error, just retry
        }
    };

    const handleFreeRegistration = async () => {
        try {
            setStatus('PROCESSING');
            const result = await eventService.registerEvent(eventId as string, 1);
            if (result.tickets) {
                setTickets(result.tickets);
            }
            setStatus('SUCCESS');
            showSuccess('Registration Complete!', 'Your ticket has been added to your wallet');
        } catch (error: any) {
            const msg = error.message || 'Registration failed';
            // Check if already registered
            if (msg.includes('đã đăng ký') || msg.includes('already registered')) {
                showInfo('Already Registered', 'You have already registered for this event!');
                router.replace('/(student)/wallet');
                return;
            }
            setErrorMessage(msg);
            setStatus('ERROR');
            showError('Registration Failed', msg);
        }
    };

    const handlePaidRegistration = async () => {
        try {
            setStatus('PROCESSING');
            const result = await eventService.registerEvent(eventId as string, 1);

            if (result.type === 'PAID' && result.paymentLink) {
                setPaymentUrl(result.paymentLink);
                // The current BE implementation might return transactionId inside 'data' or top level? 
                // Based on `EventsController.js`, usage `data: { ... transactionId ... }`
                setTransactionId(result.transactionId as string);

                showInfo('Payment Link', 'Opening payment page...');
                await Linking.openURL(result.paymentLink);

                // Stay on PROCESSING state to poll
            } else if (result.tickets) {
                // Should not happen for paid events usually, unless price is 0
                setTickets(result.tickets);
                setStatus('SUCCESS');
                showSuccess('Registration Complete!', 'Your ticket has been added');
            }
        } catch (error: any) {
            const msg = error.message || 'Registration failed';
            // Check if already registered
            if (msg.includes('đã đăng ký') || msg.includes('already registered')) {
                showInfo('Already Registered', 'You have already registered for this event!');
                router.replace('/(student)/wallet');
                return;
            }
            setErrorMessage(msg);
            setStatus('ERROR');
            showError('Payment Failed', msg);
        }
    };

    const handleOpenBrowserAgain = async () => {
        if (paymentUrl) {
            await Linking.openURL(paymentUrl);
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
                    Your ticket has been confirmed and added to your wallet.
                </Text>

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
                    onPress={() => {
                        setStatus('PENDING');
                        setErrorMessage('');
                    }}
                >
                    <Text className="text-white font-bold">Try Again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className="mt-4 p-4"
                    onPress={() => router.back()}
                >
                    <Text className="text-text-secondary font-medium">Cancel</Text>
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

    // Processing State (Paid - Polling)
    if (status === 'PROCESSING' && transactionId) {
        return (
            <SafeAreaView className="flex-1 bg-background justify-center items-center p-6">
                <ActivityIndicator size="large" color={COLORS.primary} className="mb-6" />
                <Text className="text-text text-xl font-bold mb-2">Waiting for Payment</Text>
                <Text className="text-text-secondary text-center mb-8 px-4">
                    Please complete the payment in the browser window. We are checking your payment status automatically.
                </Text>

                <TouchableOpacity
                    className="bg-card border border-border px-6 py-3 rounded-xl flex-row items-center mb-4"
                    onPress={checkPaymentStatus}
                >
                    <RefreshCw size={20} color={COLORS.primary} />
                    <Text className="text-primary font-bold ml-2">Check Status Now</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="p-4"
                    onPress={handleOpenBrowserAgain}
                >
                    <Text className="text-primary font-medium">Re-open Payment Page</Text>
                </TouchableOpacity>
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
                    <TouchableOpacity
                        className="w-full bg-primary py-4 rounded-xl items-center flex-row justify-center"
                        onPress={handlePaidRegistration}
                    >
                        <ExternalLink size={20} color="#FFF" />
                        <Text className="text-white font-bold ml-2">Proceed to Payment</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}
