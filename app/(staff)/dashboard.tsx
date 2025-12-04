import { useRouter } from 'expo-router';
import { DollarSign, FileText, ScanLine, Users } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StaffDashboard() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-gray-50 p-4">
            <View className="flex-row justify-between items-center mb-8">
                <View>
                    <Text className="text-gray-500 text-sm">Staff Portal</Text>
                    <Text className="text-2xl font-bold text-gray-900">Dashboard</Text>
                </View>
                <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center border border-green-200">
                    <Text className="font-bold text-green-700">ST</Text>
                </View>
            </View>

            <View className="flex-row flex-wrap justify-between">
                <TouchableOpacity
                    className="w-[48%] bg-white p-4 rounded-2xl mb-4 shadow-sm shadow-gray-200 items-center justify-center h-32"
                    onPress={() => router.push('/(staff)/scanner')}
                >
                    <View className="w-12 h-12 bg-indigo-100 rounded-full items-center justify-center mb-2">
                        <ScanLine size={24} color="#4F46E5" />
                    </View>
                    <Text className="font-bold text-gray-800">Check-in Scanner</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="w-[48%] bg-white p-4 rounded-2xl mb-4 shadow-sm shadow-gray-200 items-center justify-center h-32"
                    onPress={() => router.push('/(staff)/fund-request')}
                >
                    <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mb-2">
                        <FileText size={24} color="#10B981" />
                    </View>
                    <Text className="font-bold text-gray-800">Fund Request</Text>
                </TouchableOpacity>

                <View className="w-full bg-white p-4 rounded-2xl mb-4 shadow-sm shadow-gray-200">
                    <Text className="font-bold text-gray-800 mb-4">Recent Activity</Text>
                    <View className="space-y-4">
                        <View className="flex-row items-center justify-between border-b border-gray-100 pb-2">
                            <View className="flex-row items-center">
                                <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3">
                                    <DollarSign size={16} color="#2563EB" />
                                </View>
                                <View>
                                    <Text className="font-medium text-gray-800">Sold 5 tickets</Text>
                                    <Text className="text-xs text-gray-500">Welcome New Students</Text>
                                </View>
                            </View>
                            <Text className="text-xs text-gray-400">2m ago</Text>
                        </View>

                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center">
                                <View className="w-8 h-8 bg-orange-100 rounded-full items-center justify-center mr-3">
                                    <Users size={16} color="#EA580C" />
                                </View>
                                <View>
                                    <Text className="font-medium text-gray-800">Check-in User</Text>
                                    <Text className="text-xs text-gray-500">Nguyen Van B</Text>
                                </View>
                            </View>
                            <Text className="text-xs text-gray-400">15m ago</Text>
                        </View>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}
