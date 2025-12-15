import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Animated, Text, View, TouchableOpacity, Platform } from 'react-native';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
}

interface ToastContextType {
    showToast: (type: ToastType, title: string, message?: string) => void;
    showSuccess: (title: string, message?: string) => void;
    showError: (title: string, message?: string) => void;
    showWarning: (title: string, message?: string) => void;
    showInfo: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

const TOAST_CONFIG = {
    success: { bg: '#DCFCE7', border: '#22C55E', icon: CheckCircle, color: COLORS.success },
    error: { bg: '#FEE2E2', border: '#EF4444', icon: XCircle, color: COLORS.error },
    warning: { bg: '#FEF3C7', border: '#F59E0B', icon: AlertTriangle, color: COLORS.warning },
    info: { bg: '#E0F2FE', border: '#38BDF8', icon: Info, color: COLORS.info },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    const config = TOAST_CONFIG[toast.type];
    const Icon = config.icon;
    const [opacity] = useState(new Animated.Value(0));
    const [translateY] = useState(new Animated.Value(-20));

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();

        const timer = setTimeout(() => {
            Animated.parallel([
                Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
                Animated.timing(translateY, { toValue: -20, duration: 300, useNativeDriver: true }),
            ]).start(() => onDismiss());
        }, 3500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <Animated.View
            style={[
                {
                    opacity,
                    transform: [{ translateY }],
                    marginHorizontal: 16,
                    marginBottom: 8,
                    padding: 16,
                    borderRadius: 16,
                    backgroundColor: config.bg,
                    borderWidth: 1,
                    borderColor: config.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 5,
                }
            ]}
        >
            <Icon size={24} color={config.color} />
            <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: 'bold', color: COLORS.text }}>{toast.title}</Text>
                {toast.message && <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>{toast.message}</Text>}
            </View>
            <TouchableOpacity onPress={onDismiss} style={{ padding: 4 }}>
                <X size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
        </Animated.View>
    );
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
    const insets = useSafeAreaInsets();

    return (
        <View
            style={{
                position: 'absolute',
                top: insets.top + (Platform.OS === 'ios' ? 10 : 20),
                left: 0,
                right: 0,
                zIndex: 9999,
            }}
            pointerEvents="box-none"
        >
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
            ))}
        </View>
    );
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((type: ToastType, title: string, message?: string) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, type, title, message }]);
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showSuccess = useCallback((title: string, message?: string) => showToast('success', title, message), [showToast]);
    const showError = useCallback((title: string, message?: string) => showToast('error', title, message), [showToast]);
    const showWarning = useCallback((title: string, message?: string) => showToast('warning', title, message), [showToast]);
    const showInfo = useCallback((title: string, message?: string) => showToast('info', title, message), [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </ToastContext.Provider>
    );
}
