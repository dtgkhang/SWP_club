import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Landing() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-white justify-center items-center p-6">
            <View className="items-center mb-12">
                <View className="w-24 h-24 bg-primary rounded-3xl mb-6 items-center justify-center shadow-lg shadow-indigo-200">
                    <Text className="text-4xl font-bold text-white">U</Text>
                </View>
                <Text className="text-4xl font-bold text-gray-900 mb-2">UCMS</Text>
                <Text className="text-gray-500 text-center text-lg">University Club Management System</Text>
            </View>

            <View className="w-full space-y-4 gap-4">
                <TouchableOpacity
                    className="w-full bg-primary p-5 rounded-2xl items-center shadow-md shadow-indigo-200 active:opacity-90"
                    onPress={() => router.push('/(student)/home')}
                >
                    <Text className="text-white font-bold text-lg">Continue as Student</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="w-full bg-white border border-gray-200 p-5 rounded-2xl items-center active:bg-gray-50"
                    onPress={() => router.push('/(staff)/dashboard')}
                >
                    <Text className="text-gray-700 font-bold text-lg">Continue as Staff</Text>
                </TouchableOpacity>
            </View>

            <Text className="absolute bottom-10 text-gray-400 text-sm">Demo Version 1.0</Text>
        </SafeAreaView>
    );
}
