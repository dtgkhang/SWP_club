import { useRouter } from 'expo-router';
import { LogOut, Mail, Phone } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CURRENT_USER } from '../../constants/mockData';

export default function ProfileScreen() {
    const router = useRouter();

    const handleLogout = () => {
        router.replace('/');
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 p-4" edges={['top']}>
            <Text className="text-2xl font-bold text-gray-900 mb-6">My Profile</Text>

            <View className="bg-white rounded-2xl p-6 items-center shadow-sm shadow-gray-200 border border-gray-100 mb-6">
                <View className="w-24 h-24 bg-primary/10 rounded-full items-center justify-center mb-4 border-4 border-white shadow-sm">
                    <Text className="text-4xl font-bold text-primary">
                        {CURRENT_USER.name.charAt(0)}
                    </Text>
                </View>
                <Text className="text-xl font-bold text-gray-900">{CURRENT_USER.name}</Text>
                <Text className="text-gray-500">Student</Text>
            </View>

            <View className="bg-white rounded-2xl overflow-hidden shadow-sm shadow-gray-200 border border-gray-100">
                <View className="p-4 flex-row items-center border-b border-gray-100">
                    <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center mr-3">
                        <Mail size={20} color="#6B7280" />
                    </View>
                    <View>
                        <Text className="text-xs text-gray-400 uppercase font-bold">Email</Text>
                        <Text className="text-gray-700">student@fpt.edu.vn</Text>
                    </View>
                </View>
                <View className="p-4 flex-row items-center">
                    <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center mr-3">
                        <Phone size={20} color="#6B7280" />
                    </View>
                    <View>
                        <Text className="text-xs text-gray-400 uppercase font-bold">Phone</Text>
                        <Text className="text-gray-700">+84 123 456 789</Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity
                className="mt-6 bg-red-50 p-4 rounded-xl flex-row items-center justify-center border border-red-100"
                onPress={handleLogout}
            >
                <LogOut size={20} color="#EF4444" className="mr-2" />
                <Text className="text-red-500 font-bold">Log Out</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}
