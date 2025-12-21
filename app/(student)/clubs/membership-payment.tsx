import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle, CreditCard, RefreshCw, X, XCircle } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Modal, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { COLORS } from '../../../constants/theme';
import { useToast } from '../../../contexts/ToastContext';
import { clubService } from '../../../services/club.service';

const { width, height } = Dimensions.get('window');

export default function MembershipPaymentScreen() {
    const { applicationId, clubId, clubName, amount } = useLocalSearchParams();
    const router = useRouter();
    const { showSuccess, showError, showInfo } = useToast();
    const [status, setStatus] = useState<'LOADING' | 'READY' | 'WEBVIEW' | 'SUCCESS' | 'ERROR'>('LOADING');
    const [paymentLink, setPaymentLink] = useState<string | null>(null);
    const [transactionId, setTransactionId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [showWebView, setShowWebView] = useState(false);
    const pollingInterval = useRef<any>(null);

    // Reset all state and initialize when clubId changes
    useEffect(() => {
        // Reset state
        setStatus('LOADING');
        setPaymentLink(null);
        setTransactionId(null);
        setErrorMessage('');
        setShowWebView(false);
        if (pollingInterval.current) clearInterval(pollingInterval.current);

        // Initialize payment
        initializePayment();

        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        };
    }, [clubId]);

    // Start polling when WebView is closed but payment not confirmed
    useEffect(() => {
        if (status === 'READY' && transactionId && !showWebView) {
            startPolling();
        } else {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        }
    }, [status, transactionId, showWebView]);

    const initializePayment = async () => {
        try {
            setStatus('LOADING');
            const result = await clubService.getMembershipPayment(clubId as string);

            console.log('Payment result:', result);

            if (result.paymentLink) {
                setPaymentLink(result.paymentLink);
                setTransactionId(result.transactionId || null);
                setStatus('READY');
            } else {
                setErrorMessage('Could not get payment information');
                setStatus('ERROR');
            }
        } catch (error: any) {
            console.error('Payment init error:', error);
            setErrorMessage(error.message || 'Failed to initialize payment');
            setStatus('ERROR');
            showError('Error', error.message || 'Failed to initialize payment');
        }
    };

    const startPolling = () => {
        if (pollingInterval.current) clearInterval(pollingInterval.current);

        pollingInterval.current = setInterval(async () => {
            await checkPaymentStatus();
        }, 2000);
    };

    const checkPaymentStatus = async () => {
        if (!transactionId) return;
        try {
            // Use clubService which now calls the sync endpoint
            const result = await clubService.checkMembershipPaymentStatus(transactionId);
            console.log('Payment status check:', result);

            if (result.status === 'SUCCESS' || result.status === 'PAID') {
                if (pollingInterval.current) clearInterval(pollingInterval.current);
                setStatus('SUCCESS');
                showSuccess('Payment Successful!', 'You are now a member of the club!');
            } else if (result.status === 'FAILED' || result.status === 'CANCELLED') {
                if (pollingInterval.current) clearInterval(pollingInterval.current);
                setStatus('ERROR');
                setErrorMessage('Payment was cancelled or failed.');
            }
        } catch (error) {
            console.error('Polling error:', error);
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

    const handleOpenPayment = () => {
        setShowWebView(true);
        showInfo('Complete Payment', 'Please complete payment in the window');
    };

    const handleCloseWebView = () => {
        setShowWebView(false);
        showInfo('Payment Pending', 'We will check your payment status...');
    };

    // Success State
    if (status === 'SUCCESS') {
        return (
            <SafeAreaView className="flex-1 bg-background justify-center items-center p-6">
                <View className="bg-success-soft w-24 h-24 rounded-full items-center justify-center mb-6">
                    <CheckCircle size={48} color={COLORS.success} />
                </View>
                <Text className="text-text text-2xl font-bold mb-2 text-center">Welcome to the Club!</Text>
                <Text className="text-text-secondary text-center mb-2">
                    Your payment was successful.
                </Text>
                <Text className="text-text-secondary text-center mb-6">
                    You are now a member of <Text className="font-bold text-primary">{clubName}</Text>
                </Text>
                <TouchableOpacity
                    className="bg-primary px-8 py-4 rounded-xl w-full items-center"
                    onPress={() => router.replace('/(student)/clubs')}
                >
                    <Text className="text-white font-bold">View My Clubs</Text>
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
                        setStatus('LOADING');
                        setErrorMessage('');
                        setTransactionId(null);
                        setPaymentLink(null);
                        initializePayment();
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

    // Loading State
    if (status === 'LOADING') {
        return (
            <SafeAreaView className="flex-1 bg-background justify-center items-center p-6">
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text className="text-text font-medium mt-4">Loading payment...</Text>
            </SafeAreaView>
        );
    }

    // Ready State - Show payment info and button
    return (
        <SafeAreaView className="flex-1 bg-background">
            {/* Header */}
            <View className="flex-row items-center px-5 py-4 bg-card border-b border-border">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <ArrowLeft size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text className="text-text text-lg font-bold">Membership Payment</Text>
            </View>

            <View className="flex-1 items-center justify-center p-6">
                {/* Club & Amount */}
                <Text className="text-text-secondary text-sm mb-1">Membership Fee</Text>
                <Text className="text-text font-bold text-lg mb-2 text-center">{clubName}</Text>
                <View className="bg-primary-soft rounded-xl px-6 py-3 mb-8">
                    <Text className="text-primary text-2xl font-bold">
                        {Number(amount).toLocaleString()}₫
                    </Text>
                </View>

                {transactionId && !showWebView ? (
                    <>
                        {/* Status - Polling */}
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
                    </>
                ) : (
                    <>
                        <Text className="text-text-secondary text-center mb-8 px-4">
                            Complete your membership payment securely with PayOS.
                        </Text>

                        <TouchableOpacity
                            className="bg-primary px-8 py-4 rounded-xl flex-row items-center"
                            onPress={handleOpenPayment}
                        >
                            <CreditCard size={20} color="#FFF" />
                            <Text className="text-white font-bold ml-2">Pay Now</Text>
                        </TouchableOpacity>
                    </>
                )}
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
                        {paymentLink && (
                            <WebView
                                source={{ uri: paymentLink }}
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
