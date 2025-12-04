import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScannerScreen() {
    const [scanned, setScanned] = useState(false);
    const [result, setResult] = useState<null | 'VALID' | 'INVALID'>(null);
    const router = useRouter();

    const handleScan = () => {
        setScanned(true);
        // Randomly simulate valid/invalid
        const isValid = Math.random() > 0.2;
        setResult(isValid ? 'VALID' : 'INVALID');
    };

    const resetScan = () => {
        setScanned(false);
        setResult(null);
    };

    return (
        <View className="flex-1 bg-black">
            <SafeAreaView className="flex-1">
                <View className="flex-row justify-between items-center p-4">
                    <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-black/50 rounded-full">
                        <X size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text className="text-white font-bold text-lg">Scan Ticket</Text>
                    <View className="w-10" />
                </View>

                <View className="flex-1 items-center justify-center">
                    {!scanned ? (
                        <View className="w-64 h-64 border-2 border-white rounded-3xl items-center justify-center relative overflow-hidden">
                            <View className="absolute top-0 left-0 w-full h-1 bg-green-500 animate-pulse" />
                            <Text className="text-white/70 text-center px-4">Align QR code within the frame</Text>
                        </View>
                    ) : (
                        <View className="bg-white p-6 rounded-2xl items-center w-3/4">
                            <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${result === 'VALID' ? 'bg-green-100' : 'bg-red-100'}`}>
                                {result === 'VALID' ? (
                                    <Text className="text-3xl">✓</Text>
                                ) : (
                                    <Text className="text-3xl">✕</Text>
                                )}
                            </View>
                            <Text className={`text-xl font-bold mb-2 ${result === 'VALID' ? 'text-green-600' : 'text-red-600'}`}>
                                {result === 'VALID' ? 'Access Granted' : 'Invalid Ticket'}
                            </Text>
                            <Text className="text-gray-500 text-center mb-6">
                                {result === 'VALID' ? 'Ticket is valid. Welcome!' : 'This ticket has already been used or is invalid.'}
                            </Text>
                            <TouchableOpacity
                                className="bg-gray-900 px-6 py-3 rounded-xl"
                                onPress={resetScan}
                            >
                                <Text className="text-white font-bold">Scan Another</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {!scanned && (
                    <View className="p-8 items-center">
                        <TouchableOpacity
                            className="w-20 h-20 bg-white rounded-full items-center justify-center border-4 border-gray-300"
                            onPress={handleScan}
                        >
                            <View className="w-16 h-16 bg-white rounded-full border-2 border-black" />
                        </TouchableOpacity>
                        <Text className="text-white mt-4 font-medium">Tap to Simulate Scan</Text>
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
}
