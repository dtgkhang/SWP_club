import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PaymentScreen() {
    const { amount } = useLocalSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState('PENDING'); // PENDING, PROCESSING, SUCCESS

    const handlePayment = () => {
        setStatus('PROCESSING');
        setTimeout(() => {
            setStatus('SUCCESS');
            setTimeout(() => {
                router.replace('/(student)/wallet');
            }, 1500);
        }, 2000);
    };

    if (status === 'SUCCESS') {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center p-6">
                <CheckCircle size={80} color="#10B981" />
                <Text className="text-2xl font-bold text-gray-900 mt-6 mb-2">Payment Successful!</Text>
                <Text className="text-gray-500 text-center">Redirecting to your wallet...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="p-4 flex-row items-center border-b border-gray-200 bg-white">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <ArrowLeft size={24} color="#000" />
                </TouchableOpacity>
                <Text className="text-lg font-bold">PayOS Gateway</Text>
            </View>

            <View className="flex-1 p-6 items-center justify-center">
                <View className="bg-white p-8 rounded-2xl w-full items-center shadow-sm border border-gray-100">
                    <Text className="text-gray-500 mb-2">Amount to pay</Text>
                    <Text className="text-3xl font-bold text-primary mb-8">
                        {Number(amount).toLocaleString()} VND
                    </Text>

                    <View className="w-64 h-64 bg-gray-200 mb-8 items-center justify-center rounded-xl overflow-hidden">
                        {/* Mock QR Code */}
                        <View className="w-full h-full bg-white p-2">
                            <View className="w-full h-full border-4 border-black border-dashed items-center justify-center">
                                <Text className="font-bold text-gray-400">QR CODE</Text>
                            </View>
                        </View>
                    </View>

                    <Text className="text-center text-gray-500 mb-8">
                        Scan this QR code with your banking app to complete the payment.
                    </Text>

                    {status === 'PROCESSING' ? (
                        <TouchableOpacity disabled className="w-full bg-gray-300 py-4 rounded-xl items-center flex-row justify-center">
                            <ActivityIndicator color="#666" className="mr-2" />
                            <Text className="text-gray-600 font-bold text-lg">Processing...</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            className="w-full bg-primary py-4 rounded-xl items-center shadow-md shadow-indigo-200"
                            onPress={handlePayment}
                        >
                            <Text className="text-white font-bold text-lg">Simulate Payment</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}
