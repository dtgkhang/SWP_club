import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle, CreditCard, RefreshCw, XCircle } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Linking, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/theme';
import { useToast } from '../../../contexts/ToastContext';
import { clubService } from '../../../services/club.service';

const { width } = Dimensions.get('window');

export default function MembershipPaymentScreen() {
    const { applicationId, clubId, clubName, amount } = useLocalSearchParams();
    const router = useRouter();
    const { showSuccess, showError, showInfo } = useToast();
    const [status, setStatus] = useState<'LOADING' | 'SHOWING_QR' | 'SUCCESS' | 'ERROR'>('LOADING');
    const [paymentQrCode, setPaymentQrCode] = useState<string | null>(null);
    const [paymentLink, setPaymentLink] = useState<string | null>(null);
    const [transactionId, setTransactionId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const pollingInterval = useRef<any>(null);

    useEffect(() => {
        initializePayment();
        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        };
    }, []);

    useEffect(() => {
        if (status === 'SHOWING_QR' && transactionId) {
            startPolling();
        } else {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        }
    }, [status, transactionId]);

    const initializePayment = async () => {
        try {
            setStatus('LOADING');
            // Call API to create payment for this membership using clubId
            const result = await clubService.getMembershipPayment(clubId as string);

            console.log('Payment result:', result);

            if (result.paymentLink) {
                setPaymentLink(result.paymentLink);
                setTransactionId(result.transactionId || null);

                if (result.qrCode) {
                    setPaymentQrCode(result.qrCode);
                }

                setStatus('SHOWING_QR');
                showInfo('Payment Ready', 'Scan QR code or open link to pay');
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
        }, 3000);
    };

    const checkPaymentStatus = async () => {
        if (!transactionId) return;
        try {
            const result = await clubService.checkMembershipPaymentStatus(transactionId);
            console.log('Payment status:', result);

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

    const handleOpenBrowser = async () => {
        if (paymentLink) {
            await Linking.openURL(paymentLink);
        }
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
                    onPress={initializePayment}
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

    // QR Code State
    const qrSize = width - 120;
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
                <View className="bg-primary-soft rounded-xl px-6 py-3 mb-6">
                    <Text className="text-primary text-2xl font-bold">
                        {Number(amount).toLocaleString()}₫
                    </Text>
                </View>

                {paymentQrCode ? (
                    <>
                        {/* QR Code */}
                        <View className="bg-white p-4 rounded-2xl shadow-lg mb-6">
                            <Image
                                source={{ uri: paymentQrCode }}
                                style={{ width: qrSize, height: qrSize }}
                                resizeMode="contain"
                            />
                        </View>

                        <Text className="text-text-secondary text-center mb-4 px-4">
                            Scan this QR code with your banking app to pay
                        </Text>
                    </>
                ) : (
                    <TouchableOpacity
                        className="bg-primary px-8 py-4 rounded-xl flex-row items-center mb-6"
                        onPress={handleOpenBrowser}
                    >
                        <CreditCard size={20} color="#FFF" />
                        <Text className="text-white font-bold ml-2">Open Payment Page</Text>
                    </TouchableOpacity>
                )}

                {/* Status */}
                <View className="flex-row items-center bg-warning-soft px-4 py-2 rounded-xl mb-4">
                    <ActivityIndicator size="small" color={COLORS.warning} />
                    <Text className="text-warning font-medium ml-2">Checking payment status...</Text>
                </View>

                <TouchableOpacity
                    className="bg-card border border-border px-6 py-3 rounded-xl flex-row items-center"
                    onPress={checkPaymentStatus}
                >
                    <RefreshCw size={18} color={COLORS.primary} />
                    <Text className="text-primary font-bold ml-2">Check Status Now</Text>
                </TouchableOpacity>

                {paymentQrCode && (
                    <TouchableOpacity className="p-4 mt-2" onPress={handleOpenBrowser}>
                        <Text className="text-text-secondary text-sm">Or pay via browser →</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}
