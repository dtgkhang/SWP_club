import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { CheckCircle, XCircle } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { useToast } from '../../contexts/ToastContext';

import { eventService } from '../../services/event.service';

interface ScanResult {
    status: 'success' | 'error';
    title: string;
    message: string;
    data?: any;
}

export default function ScannerScreen() {
    const router = useRouter();
    const { showSuccess, showError } = useToast();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [result, setResult] = useState<ScanResult | null>(null);

    if (!permission) {
        // Camera permissions are still loading.
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.permissionContainer}>
                <View style={styles.permissionContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color={COLORS.textSecondary} />
                    <Text style={styles.message}>We need your permission to use the camera</Text>
                    <TouchableOpacity style={styles.button} onPress={requestPermission}>
                        <Text style={styles.buttonText}>Grant Permission</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
        if (scanned) return;
        setScanned(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        console.log(`Bar code with type ${type} and data ${data} has been scanned!`);

        try {
            // Call API to verify ticket
            const response = await eventService.checkIn(data);

            if (response.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setResult({
                    status: 'success',
                    title: 'Check-in Successful',
                    message: response.message || 'Ticket is valid.',
                    data: response.data
                });
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                setResult({
                    status: 'error',
                    title: 'Check-in Failed',
                    message: response.message || 'Invalid ticket.',
                });
            }
        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setResult({
                status: 'error',
                title: 'Check-in Error',
                message: error.message || 'Could not verify ticket.',
            });
        }
    };

    const handleScanNext = () => {
        setResult(null);
        setScanned(false);
    };

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFillObject}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
            />

            <SafeAreaView style={styles.overlay}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Scan Ticket</Text>
                    <View style={{ width: 40 }} />
                </View>

                {!result && (
                    <View style={styles.scanAreaContainer}>
                        <View style={styles.scanArea}>
                            <View style={[styles.corner, styles.topLeft]} />
                            <View style={[styles.corner, styles.topRight]} />
                            <View style={[styles.corner, styles.bottomLeft]} />
                            <View style={[styles.corner, styles.bottomRight]} />
                        </View>
                        <Text style={styles.hintText}>Align QR code within the frame</Text>
                    </View>
                )}

                {result && (
                    <View style={styles.resultContainer}>
                        <View style={[styles.resultCard, result.status === 'success' ? styles.successCard : styles.errorCard]}>
                            {result.status === 'success' ? (
                                <CheckCircle size={64} color="#22c55e" />
                            ) : (
                                <XCircle size={64} color="#ef4444" />
                            )}
                            <Text style={styles.resultTitle}>{result.title}</Text>
                            <Text style={styles.resultMessage}>{result.message}</Text>

                            {result.data?.user && (
                                <View style={styles.detailRow}>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>Attendee</Text>
                                        <Text style={styles.detailValue}>{result.data.user.fullName}</Text>
                                    </View>
                                </View>
                            )}

                            {result.data?.event && (
                                <View style={styles.detailRow}>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>Event</Text>
                                        <Text style={styles.detailValue}>{result.data.event.title}</Text>
                                    </View>
                                </View>
                            )}

                            <TouchableOpacity style={styles.nextButton} onPress={handleScanNext}>
                                <Text style={styles.nextButtonText}>Scan Next</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: COLORS.background,
    },
    message: {
        textAlign: 'center',
        marginVertical: 20,
        fontSize: 16,
        color: COLORS.text,
        fontFamily: 'Inter-Regular',
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    scanAreaContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    scanArea: {
        width: 250,
        height: 250,
        borderRadius: 20,
        backgroundColor: 'transparent',
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: COLORS.primary,
        borderWidth: 4,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderBottomWidth: 0,
        borderRightWidth: 0,
        borderTopLeftRadius: 20,
    },
    topRight: {
        top: 0,
        right: 0,
        borderBottomWidth: 0,
        borderLeftWidth: 0,
        borderTopRightRadius: 20,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderTopWidth: 0,
        borderRightWidth: 0,
        borderBottomLeftRadius: 20,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderBottomRightRadius: 20,
    },
    hintText: {
        color: 'white',
        marginTop: 20,
        fontSize: 14,
        opacity: 0.8,
    },
    footer: {
        padding: 20,
        alignItems: 'center',
    },
    rescanButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 30,
    },
    rescanText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    resultContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    resultCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    successCard: {
        borderTopWidth: 5,
        borderTopColor: '#22c55e',
    },
    errorCard: {
        borderTopWidth: 5,
        borderTopColor: '#ef4444',
    },
    resultTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
        color: COLORS.text,
        textAlign: 'center',
    },
    resultMessage: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 20,
    },
    detailRow: {
        width: '100%',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 10,
    },
    detailItem: {
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        fontWeight: '600',
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 18,
        color: COLORS.text,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    nextButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    nextButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    }
});

