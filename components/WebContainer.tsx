import { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

interface WebContainerProps {
    children: ReactNode;
}

export default function WebContainer({ children }: WebContainerProps) {
    if (Platform.OS !== 'web') {
        return <>{children}</>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E5E7EB', // gray-200
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    content: {
        width: '100%',
        maxWidth: 480, // Mobile width limit
        height: '100%',
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        overflow: 'hidden',
        position: 'relative', // Ensure absolute children (like Tab Bar) are contained
    },
});
