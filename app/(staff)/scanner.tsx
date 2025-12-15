import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { CheckCircle, RefreshCw, X, XCircle } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import api from '../../services/api';

interface CheckinResult {
    success: boolean;
    message: string;
    isAlreadyCheckedIn?: boolean;
    data?: {
        user?: {
            fullName?: string;
            email?: string;
            studentCode?: string;
        };
        event?: {
            title?: string;
        };
        scannedAt?: string;
        checkedInAt?: string;
    };
}

// Cooldown between scans (in ms)
const SCAN_COOLDOWN = 3000;

export default function ScannerScreen() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();

    // Scan cooldown ref
    const lastScanTime = useRef<number>(0);
    const lastScannedCode = useRef<string>('');

    // Scanning state
    const [scanned, setScanned] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState<CheckinResult | null>(null);

    // Stats
    const [scanCount, setScanCount] = useState(0);
    const [successCount, setSuccessCount] = useState(0);

    const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
        // Already scanned or processing
        if (scanned || processing) return;

        const now = Date.now();

        // Prevent rapid re-scanning of same code
        if (data === lastScannedCode.current && now - lastScanTime.current < SCAN_COOLDOWN) {
            return;
        }

        // Update refs
        lastScanTime.current = now;
        lastScannedCode.current = data;

        // Validate QR format (should start with EVENT-)
        if (!data.startsWith('EVENT-')) {
            setScanned(true);
            setResult({
                success: false,
                message: 'Invalid QR code. This is not a valid event ticket.',
            });
            return;
        }

        setScanned(true);
        setProcessing(true);
        setScanCount(prev => prev + 1);

        try {
            const response = await api<CheckinResult>('/checkin/qr', {
                method: 'POST',
                body: JSON.stringify({ qrCode: data }),
            });

            setResult(response);
            if (response.success && !response.isAlreadyCheckedIn) {
                setSuccessCount(prev => prev + 1);
            }
        } catch (error: any) {
            // Translate common Vietnamese errors
            let message = error.message || 'Check-in failed. Please try again.';
            if (message.includes('staff/leader của event')) {
                message = 'You are not authorized to check-in for this event.';
            } else if (message.includes('thời gian check-in')) {
                message = 'Check-in is not available yet. Please try again closer to the event time.';
            } else if (message.includes('không tìm thấy vé')) {
                message = 'Ticket not found. Please verify the QR code is valid.';
            } else if (message.includes('đã kết thúc')) {
                message = 'This event has ended. Check-in is no longer available.';
            } else if (message.includes('chưa được thanh toán')) {
                message = 'This ticket has not been paid yet.';
            }

            setResult({
                success: false,
                message,
            });
        } finally {
            setProcessing(false);
        }
    };

    const resetScanner = () => {
        setScanned(false);
        setResult(null);
        // Allow same code to be scanned again after reset
        lastScannedCode.current = '';
    };

    // Camera permission check
    if (!permission) {
        return (
            <View className="flex-1 bg-black justify-center items-center">
                <ActivityIndicator size="large" color="#FFF" />
            </View>
        );
    }

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
                    className="bg-success px-8 py-4 rounded-xl"
                    onPress={requestPermission}
                >
                    <Text className="text-white font-bold">Grant Permission</Text>
                </TouchableOpacity>
                <TouchableOpacity className="mt-4 p-4" onPress={() => router.back()}>
                    <Text className="text-white/70">Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Quick Scan Camera View
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
                    <View className="items-center flex-1 mx-4">
                        <Text className="text-white font-bold text-lg">Quick Scan</Text>
                        <Text className="text-white/60 text-xs">
                            Scan any event ticket QR code
                        </Text>
                    </View>
                    {/* Stats Badge */}
                    <View className="bg-success/80 px-3 py-1.5 rounded-full">
                        <Text className="text-white font-bold text-sm">{successCount}/{scanCount}</Text>
                    </View>
                </View>

                {/* Camera View or Result */}
                <View className="flex-1 items-center justify-center">
                    {!scanned ? (
                        <>
                            <CameraView
                                style={{ width: '100%', height: '100%', position: 'absolute' }}
                                facing="back"
                                barcodeScannerSettings={{
                                    barcodeTypes: ['qr'],
                                }}
                                onBarcodeScanned={handleBarCodeScanned}
                            />

                            {/* Scanning Frame */}
                            <View className="absolute inset-0 items-center justify-center">
                                <View className="w-72 h-72 border-2 border-white/50 rounded-3xl items-center justify-center overflow-hidden">
                                    {/* Corner accents */}
                                    <View className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-success rounded-tl-2xl" />
                                    <View className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-success rounded-tr-2xl" />
                                    <View className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-success rounded-bl-2xl" />
                                    <View className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-success rounded-br-2xl" />
                                </View>
                                <Text className="text-white/80 mt-6 text-center px-4">
                                    Point camera at ticket QR code
                                </Text>
                            </View>
                        </>
                    ) : (
                        <View className="bg-white p-6 rounded-3xl items-center w-5/6 max-w-sm">
                            {processing ? (
                                <>
                                    <ActivityIndicator size="large" color={COLORS.success} />
                                    <Text className="text-text font-bold text-lg mt-4">Processing...</Text>
                                </>
                            ) : result ? (
                                <>
                                    <View className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${result.success ? 'bg-success-soft' : 'bg-danger-soft'}`}>
                                        {result.success ? (
                                            <CheckCircle size={40} color={COLORS.success} />
                                        ) : (
                                            <XCircle size={40} color={COLORS.error} />
                                        )}
                                    </View>

                                    <Text className={`text-2xl font-bold mb-2 ${result.success ? 'text-success' : 'text-danger'}`}>
                                        {result.success
                                            ? (result.isAlreadyCheckedIn ? 'Already Checked In' : 'Check-in Success!')
                                            : 'Check-in Failed'}
                                    </Text>

                                    <Text className="text-text-secondary text-center mb-4">
                                        {result.message}
                                    </Text>

                                    {result.success && result.data?.user && (
                                        <View className="bg-background w-full p-4 rounded-xl mb-4">
                                            <Text className="text-text font-bold text-lg">
                                                {result.data.user.fullName || 'Guest'}
                                            </Text>
                                            <Text className="text-text-secondary text-sm">
                                                {result.data.user.studentCode || result.data.user.email}
                                            </Text>
                                            {result.data.event && (
                                                <Text className="text-success text-sm mt-1 font-medium">
                                                    {result.data.event.title}
                                                </Text>
                                            )}
                                        </View>
                                    )}

                                    <TouchableOpacity
                                        className="bg-success px-6 py-3 rounded-xl flex-row items-center"
                                        onPress={resetScanner}
                                    >
                                        <RefreshCw size={18} color="#FFF" />
                                        <Text className="text-white font-bold ml-2">Scan Next</Text>
                                    </TouchableOpacity>
                                </>
                            ) : null}
                        </View>
                    )}
                </View>

                {/* Bottom Info */}
                {!scanned && (
                    <View className="p-6 items-center">
                        <View className="bg-success/20 px-4 py-2 rounded-full">
                            <Text className="text-white/90 text-sm">
                                📷 Ready to scan • Auto-detect event
                            </Text>
                        </View>
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
}
