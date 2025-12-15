import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Animated, Text, View, TouchableOpacity } from 'react-native';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react-native';
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
    success: { bg: 'bg-success-soft', border: 'border-success', icon: CheckCircle, color: COLORS.success },
    error: { bg: 'bg-danger-soft', border: 'border-danger', icon: XCircle, color: COLORS.error },
    warning: { bg: 'bg-warning-soft', border: 'border-warning', icon: AlertTriangle, color: COLORS.warning },
    info: { bg: 'bg-info-soft', border: 'border-info', icon: Info, color: COLORS.info },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    const config = TOAST_CONFIG[toast.type];
    const Icon = config.icon;
    const [opacity] = useState(new Animated.Value(0));

    React.useEffect(() => {
        Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();

        const timer = setTimeout(() => {
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => onDismiss());
        }, 3500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <Animated.View
            style={{ opacity }}
            className={`mx-4 mb-2 p-4 rounded-xl border ${config.bg} ${config.border} flex-row items-center shadow-lg`}
        >
            <Icon size={24} color={config.color} />
            <View className="flex-1 ml-3">
                <Text className="text-text font-bold">{toast.title}</Text>
                {toast.message && <Text className="text-text-secondary text-sm">{toast.message}</Text>}
            </View>
            <TouchableOpacity onPress={onDismiss} className="p-1">
                <X size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
        </Animated.View>
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
            <View className="absolute top-12 left-0 right-0 z-50">
                {toasts.map(toast => (
                    <ToastItem key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
                ))}
            </View>
        </ToastContext.Provider>
    );
}
