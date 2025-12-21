import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle, CreditCard, RefreshCw, X, XCircle } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Modal, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { COLORS } from '../../constants/theme';
import { useToast } from '../../contexts/ToastContext';
import { eventService } from '../../services/event.service';
import { transactionService } from '../../services/transaction.service';

const { width, height } = Dimensions.get('window');

export default function PaymentScreen() {
    const { eventId, eventTitle, amount, isFree } = useLocalSearchParams();
    const router = useRouter();
    const { showSuccess, showError, showInfo } = useToast();
    const [status, setStatus] = useState<'PENDING' | 'PROCESSING' | 'WEBVIEW' | 'SUCCESS' | 'ERROR'>('PENDING');
    const [tickets, setTickets] = useState<any[]>([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [transactionId, setTransactionId] = useState<string | null>(null);
    const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
    const [showWebView, setShowWebView] = useState(false);
    const pollingInterval = useRef<any>(null);

    // Reset all state when eventId changes (navigating to a new event)
    useEffect(() => {
        setStatus('PENDING');
        setTickets([]);
        setErrorMessage('');
        setTransactionId(null);
        setPaymentUrl(null);
        setShowWebView(false);
        if (pollingInterval.current) clearInterval(pollingInterval.current);

        // Start free registration if applicable
        if (isFree === 'true') {
            handleFreeRegistration();
        }

        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        };
    }, [eventId, isFree]);

    // Polling Logic - Start when WebView is closed but payment not confirmed
    useEffect(() => {
        if (status === 'PROCESSING' && transactionId && !showWebView) {
            startPolling();
        } else {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        }
    }, [status, transactionId, showWebView]);

    const startPolling = () => {
        if (pollingInterval.current) clearInterval(pollingInterval.current);

        pollingInterval.current = setInterval(async () => {
            await checkPaymentStatus();
        }, 2000); // Check every 2 seconds
    };

    const checkPaymentStatus = async () => {
        if (!transactionId) return;
        try {
            // Use checkAndSyncPaymentStatus instead of getTransaction
            // This actively queries PayOS and updates the database if payment is successful
            // This fixes the issue where webhook cannot reach localhost servers
            const result = await transactionService.checkAndSyncPaymentStatus(transactionId);
            console.log('Check Status Result:', result);

            if (result.status === 'SUCCESS') {
                if (pollingInterval.current) clearInterval(pollingInterval.current);
                // Fetch full transaction to get tickets
                try {
                    const transaction = await transactionService.getTransaction(transactionId);
                    setTickets(transaction.tickets || []);
                } catch (e) {
                    console.log('Could not fetch tickets:', e);
                }
                setStatus('SUCCESS');
                showSuccess('Payment Successful!', 'Your ticket has been confirmed.');
            } else if (result.status === 'FAILED' || result.status === 'CANCELLED') {
                if (pollingInterval.current) clearInterval(pollingInterval.current);
                setStatus('ERROR');
                setErrorMessage('Payment was cancelled or failed.');
            }
            // If still PENDING, polling will continue
        } catch (error) {
            console.error('Check status error:', error);
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

            console.log('Registration result:', JSON.stringify(result, null, 2));

            // PAID event - must have paymentLink
            if (result.type === 'PAID') {
                if (result.paymentLink) {
                    setPaymentUrl(result.paymentLink);
                    setTransactionId(result.transactionId as string);
                    setShowWebView(true);
                    setStatus('WEBVIEW');
                    showInfo('Complete Payment', 'Please complete payment in the window');
                } else {
                    // PAID but no payment link - error
                    setStatus('ERROR');
                    setErrorMessage('Could not get payment link. Please try again.');
                    showError('Payment Error', 'Could not get payment link');
                }
            }
            // FREE event - tickets returned immediately
            else if (result.type === 'FREE' && result.tickets) {
                setTickets(result.tickets);
                setStatus('SUCCESS');
                showSuccess('Registration Complete!', 'Your ticket has been added');
            }
            // Unknown response type
            else {
                console.log('Unexpected response:', result);
                setStatus('ERROR');
                setErrorMessage('Unexpected response from server');
                showError('Error', 'Unexpected response from server');
            }
        } catch (error: any) {
            const msg = error.message || 'Registration failed';
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

    // Handle WebView navigation state change - detect success/cancel
    const handleWebViewNavigationChange = (navState: any) => {
        const { url } = navState;
        console.log('WebView URL:', url);

        // Detect success return URL
        if (url.includes('/return') || url.includes('status=SUCCESS') || url.includes('status=PAID')) {
            console.log('Payment success detected from URL');
            setShowWebView(false);
            // Start polling to confirm
            checkPaymentStatus();
        }

        // Detect cancel URL
        if (url.includes('/cancel') || url.includes('status=CANCELLED')) {
            console.log('Payment cancelled detected from URL');
            setShowWebView(false);
            setStatus('ERROR');
            setErrorMessage('Payment was cancelled.');
        }
    };

    const handleCloseWebView = () => {
        setShowWebView(false);
        // Continue polling after closing
        showInfo('Payment Pending', 'We will check your payment status...');
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
                <Text className="text-text text-2xl font-bold mb-2">Payment Failed</Text>
                <Text className="text-text-secondary text-center mb-6">{errorMessage}</Text>
                <TouchableOpacity
                    className="bg-primary px-8 py-4 rounded-xl w-full items-center"
                    onPress={() => {
                        setStatus('PENDING');
                        setErrorMessage('');
                        setTransactionId(null);
                        setPaymentUrl(null);
                    }}
                >
                    <Text className="text-white font-bold">Try Again</Text>
                </TouchableOpacity>
                <TouchableOpacity className="mt-4 p-4" onPress={() => router.back()}>
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

    // Processing State (Waiting for payment with polling)
    if (status === 'PROCESSING' && transactionId && !showWebView) {
        return (
            <SafeAreaView className="flex-1 bg-background">
                {/* Header */}
                <View className="flex-row items-center px-5 py-4 bg-card border-b border-border">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4">
                        <ArrowLeft size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text className="text-text text-lg font-bold">Payment</Text>
                </View>

                <View className="flex-1 items-center justify-center p-6">
                    {/* Event & Amount */}
                    <Text className="text-text-secondary text-sm mb-1">Pay for Event</Text>
                    <Text className="text-text font-bold text-lg mb-2 text-center">{eventTitle}</Text>
                    <View className="bg-primary-soft rounded-xl px-6 py-3 mb-8">
                        <Text className="text-primary text-2xl font-bold">
                            {Number(amount).toLocaleString()}₫
                        </Text>
                    </View>

                    {/* Status */}
                    <View className="flex-row items-center bg-warning-soft px-6 py-3 rounded-xl mb-6">
                        <ActivityIndicator size="small" color={COLORS.warning} />
                        <Text className="text-warning font-medium ml-3">Waiting for payment...</Text>
                    </View>

                    <TouchableOpacity
                        className="bg-primary px-6 py-4 rounded-xl flex-row items-center mb-4"
                        onPress={() => setShowWebView(true)}
                    >
                        <CreditCard size={20} color="#FFF" />
                        <Text className="text-white font-bold ml-2">Open Payment Page</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-card border border-border px-6 py-3 rounded-xl flex-row items-center"
                        onPress={checkPaymentStatus}
                    >
                        <RefreshCw size={18} color={COLORS.primary} />
                        <Text className="text-primary font-bold ml-2">Check Status</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Default: Payment Confirmation UI
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
                        Complete your payment securely with PayOS.
                    </Text>

                    {/* Payment Button */}
                    <TouchableOpacity
                        className="w-full bg-primary py-4 rounded-xl items-center flex-row justify-center"
                        onPress={handlePaidRegistration}
                        disabled={status === 'PROCESSING'}
                    >
                        {status === 'PROCESSING' ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <>
                                <CreditCard size={20} color="#FFF" />
                                <Text className="text-white font-bold ml-2">Pay Now</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* WebView Modal */}
            <Modal
                visible={showWebView}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={handleCloseWebView}
            >
                <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingHorizontal: 16,
                            paddingVertical: 14,
                            backgroundColor: '#FFFFFF',
                            borderBottomWidth: 1,
                            borderBottomColor: '#F1F5F9'
                        }}
                    >
                        <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#1E293B' }}>Complete Payment</Text>
                        <TouchableOpacity
                            onPress={handleCloseWebView}
                            style={{ padding: 8, backgroundColor: '#F1F5F9', borderRadius: 20 }}
                        >
                            <X size={20} color="#1E293B" />
                        </TouchableOpacity>
                    </View>

                    <View style={{ flex: 1 }}>
                        {paymentUrl && (
                            <WebView
                                source={{ uri: paymentUrl }}
                                onNavigationStateChange={handleWebViewNavigationChange}
                                startInLoadingState={true}
                                javaScriptEnabled={true}
                                domStorageEnabled={true}
                                contentMode="mobile"
                                renderLoading={() => (
                                    <View style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: '#FFFFFF'
                                    }}>
                                        <ActivityIndicator size="large" color={COLORS.primary} />
                                        <Text style={{ color: '#64748B', marginTop: 16 }}>Loading payment page...</Text>
                                    </View>
                                )}
                                style={{ flex: 1 }}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
