import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { CheckCircle, RefreshCw, X, XCircle } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import api from '../../services/api';

interface CheckinResult {
    success: boolean;
    message: string;
    alreadyCheckedIn?: boolean;
    data?: {
        user?: {
            fullName?: string;
            email?: string;
            studentCode?: string;
        };
        event?: {
            title?: string;
        };
        checkinTime?: string;
    };
}

export default function ScannerScreen() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState<CheckinResult | null>(null);

    const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
        if (scanned || processing) return;

        setScanned(true);
        setProcessing(true);

        try {
            // Call check-in API
            const response = await api<CheckinResult>('/checkin/qr', {
                method: 'POST',
                body: JSON.stringify({ qrCode: data }),
            });

            setResult(response);
        } catch (error: any) {
            setResult({
                success: false,
                message: error.message || 'Check-in failed. Please try again.',
            });
        } finally {
            setProcessing(false);
        }
    };

    const resetScanner = () => {
        setScanned(false);
        setResult(null);
    };

    // Permission not determined yet
    if (!permission) {
        return (
            <View className="flex-1 bg-black justify-center items-center">
                <ActivityIndicator size="large" color="#FFF" />
            </View>
        );
    }

    // Permission denied
    if (!permission.granted) {
        return (
            <View className="flex-1 bg-black justify-center items-center p-6">
                <Text className="text-white text-xl font-bold mb-4 text-center">
                    Camera Permission Required
                </Text>
                <Text className="text-white/70 text-center mb-6">
                    We need access to your camera to scan QR codes for event check-in.
                </Text>
                <TouchableOpacity
                    className="bg-primary px-8 py-4 rounded-xl"
                    onPress={requestPermission}
                >
                    <Text className="text-white font-bold">Grant Permission</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className="mt-4 p-4"
                    onPress={() => router.back()}
                >
                    <Text className="text-white/70">Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="flex-row justify-between items-center p-4 z-10">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 items-center justify-center bg-black/50 rounded-full"
                    >
                        <X size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text className="text-white font-bold text-lg">Scan Ticket</Text>
                    <View className="w-10" />
                </View>

                {/* Camera View or Result */}
                <View className="flex-1 items-center justify-center">
                    {!scanned ? (
                        <>
                            {/* Camera */}
                            <CameraView
                                style={{ width: '100%', height: '100%', position: 'absolute' }}
                                facing="back"
                                barcodeScannerSettings={{
                                    barcodeTypes: ['qr'],
                                }}
                                onBarcodeScanned={handleBarCodeScanned}
                            />

                            {/* Overlay */}
                            <View className="absolute inset-0 items-center justify-center">
                                <View className="w-72 h-72 border-2 border-white rounded-3xl items-center justify-center overflow-hidden">
                                    {/* Scanning line */}
                                    <View className="absolute top-0 left-0 right-0 h-1 bg-primary" />

                                    {/* Corner decorations */}
                                    <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                                    <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                                    <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                                    <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
                                </View>

                                <Text className="text-white/80 mt-6 text-center px-4">
                                    Position the QR code within the frame
                                </Text>
                            </View>
                        </>
                    ) : (
                        /* Result View */
                        <View className="bg-white p-6 rounded-3xl items-center w-5/6 max-w-sm">
                            {processing ? (
                                <>
                                    <ActivityIndicator size="large" color={COLORS.primary} />
                                    <Text className="text-text font-bold text-lg mt-4">Processing...</Text>
                                </>
                            ) : result ? (
                                <>
                                    {/* Status Icon */}
                                    <View className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${result.success ? 'bg-success-soft' : 'bg-danger-soft'}`}>
                                        {result.success ? (
                                            <CheckCircle size={40} color={COLORS.success} />
                                        ) : (
                                            <XCircle size={40} color={COLORS.error} />
                                        )}
                                    </View>

                                    {/* Status Text */}
                                    <Text className={`text-2xl font-bold mb-2 ${result.success ? 'text-success' : 'text-danger'}`}>
                                        {result.success
                                            ? (result.alreadyCheckedIn ? 'Already Checked In' : 'Check-in Success!')
                                            : 'Check-in Failed'}
                                    </Text>

                                    <Text className="text-text-secondary text-center mb-4">
                                        {result.message}
                                    </Text>

                                    {/* User Info */}
                                    {result.success && result.data?.user && (
                                        <View className="bg-background w-full p-4 rounded-xl mb-4">
                                            <Text className="text-text font-bold text-lg">
                                                {result.data.user.fullName || 'Guest'}
                                            </Text>
                                            <Text className="text-text-secondary text-sm">
                                                {result.data.user.studentCode || result.data.user.email}
                                            </Text>
                                            {result.data.event && (
                                                <Text className="text-primary text-sm mt-1">
                                                    {result.data.event.title}
                                                </Text>
                                            )}
                                        </View>
                                    )}

                                    {/* Scan Another Button */}
                                    <TouchableOpacity
                                        className="bg-text px-6 py-3 rounded-xl flex-row items-center"
                                        onPress={resetScanner}
                                    >
                                        <RefreshCw size={18} color="#FFF" />
                                        <Text className="text-white font-bold ml-2">Scan Another</Text>
                                    </TouchableOpacity>
                                </>
                            ) : null}
                        </View>
                    )}
                </View>

                {/* Bottom Info */}
                {!scanned && (
                    <View className="p-6 items-center">
                        <View className="bg-white/10 px-4 py-2 rounded-full">
                            <Text className="text-white/80 text-sm">
                                📷 Camera ready • Point at QR code
                            </Text>
                        </View>
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
}
