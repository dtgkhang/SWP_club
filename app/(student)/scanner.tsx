import { useRouter } from 'expo-router';
import { CheckCircle, X, XCircle } from 'lucide-react-native';
import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';

export default function ScannerScreen() {
    const [scanned, setScanned] = useState(false);
    const [result, setResult] = useState<null | 'VALID' | 'INVALID'>(null);
    const router = useRouter();

    const handleScan = () => {
        setScanned(true);
        // Simulate scan result
        const isValid = Math.random() > 0.2;
        setResult(isValid ? 'VALID' : 'INVALID');
    };

    const resetScan = () => {
        setScanned(false);
        setResult(null);
    };

    return (
        <View className="flex-1 bg-text">
            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="flex-row justify-between items-center px-5 py-4">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 items-center justify-center bg-white/10 rounded-xl"
                    >
                        <X size={22} color="#FFF" />
                    </TouchableOpacity>
                    <Text className="text-white font-bold text-lg">Check-in Scanner</Text>
                    <View className="w-10" />
                </View>

                {/* Scanner Area */}
                <View className="flex-1 items-center justify-center px-8">
                    {!scanned ? (
                        <>
                            {/* Scanner Frame */}
                            <View className="w-64 h-64 border-2 border-white/50 rounded-3xl items-center justify-center relative overflow-hidden mb-8">
                                {/* Scan line animation placeholder */}
                                <View className="absolute top-0 left-0 w-full h-1 bg-primary" />

                                {/* Corner decorations */}
                                <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                                <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                                <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                                <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />

                                <Text className="text-white/50 text-center px-6">
                                    Align QR code within the frame
                                </Text>
                            </View>

                            {/* Manual Scan Button */}
                            <TouchableOpacity
                                className="w-20 h-20 bg-primary rounded-full items-center justify-center shadow-lg"
                                onPress={handleScan}
                            >
                                <View className="w-16 h-16 bg-white rounded-full border-4 border-primary" />
                            </TouchableOpacity>
                            <Text className="text-white/70 mt-4 font-medium">Tap to Simulate Scan</Text>
                        </>
                    ) : (
                        /* Result Card */
                        <View className="bg-card rounded-3xl p-8 items-center w-full max-w-sm">
                            <View className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${result === 'VALID' ? 'bg-success-soft' : 'bg-danger-soft'
                                }`}>
                                {result === 'VALID' ? (
                                    <CheckCircle size={40} color={COLORS.success} />
                                ) : (
                                    <XCircle size={40} color={COLORS.error} />
                                )}
                            </View>
                            <Text className={`text-2xl font-bold mb-2 ${result === 'VALID' ? 'text-success' : 'text-danger'
                                }`}>
                                {result === 'VALID' ? 'Access Granted' : 'Invalid Ticket'}
                            </Text>
                            <Text className="text-text-secondary text-center mb-6">
                                {result === 'VALID'
                                    ? 'Ticket verified successfully. Welcome!'
                                    : 'This ticket is invalid or has already been used.'}
                            </Text>
                            <TouchableOpacity
                                className="bg-text px-8 py-4 rounded-xl w-full items-center"
                                onPress={resetScan}
                            >
                                <Text className="text-white font-bold">Scan Another</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Bottom Info */}
                {!scanned && (
                    <View className="px-8 pb-8">
                        <View className="bg-white/10 rounded-xl p-4">
                            <Text className="text-white/80 text-center text-sm">
                                Point your camera at the attendee's QR code to verify their ticket
                            </Text>
                        </View>
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
}
