import { useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = () => {
        // Mock login logic
        if (email.includes('staff')) {
            router.replace('/(staff)/dashboard');
        } else {
            router.replace('/(student)/home');
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                    <View className="flex-1 p-8 justify-center">
                        <View className="items-center mb-10">
                            <View className="w-24 h-24 bg-primary rounded-3xl mb-6 items-center justify-center shadow-lg shadow-indigo-200">
                                <Text className="text-4xl font-bold text-white">U</Text>
                            </View>
                            <Text className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</Text>
                            <Text className="text-gray-500 text-center">Sign in to continue to UCMS</Text>
                        </View>

                        <View className="space-y-4">
                            <View>
                                <Text className="text-gray-700 font-medium mb-2 ml-1">Email Address</Text>
                                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 h-14">
                                    <Mail size={20} color="#9CA3AF" />
                                    <TextInput
                                        className="flex-1 ml-3 text-gray-900 text-base"
                                        placeholder="student@university.edu.vn"
                                        placeholderTextColor="#9CA3AF"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-gray-700 font-medium mb-2 ml-1">Password</Text>
                                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 h-14">
                                    <Lock size={20} color="#9CA3AF" />
                                    <TextInput
                                        className="flex-1 ml-3 text-gray-900 text-base"
                                        placeholder="••••••••"
                                        placeholderTextColor="#9CA3AF"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        {showPassword ? (
                                            <EyeOff size={20} color="#9CA3AF" />
                                        ) : (
                                            <Eye size={20} color="#9CA3AF" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity className="items-end">
                                <Text className="text-primary font-medium">Forgot Password?</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className="w-full bg-primary h-14 rounded-xl items-center justify-center shadow-md shadow-indigo-200 mt-4"
                                onPress={handleLogin}
                            >
                                <Text className="text-white font-bold text-lg">Login</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="mt-8 flex-row justify-center">
                            <Text className="text-gray-500">Don't have an account? </Text>
                            <TouchableOpacity>
                                <Text className="text-primary font-bold">Register</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="mt-8">
                            <Text className="text-center text-gray-400 text-xs mb-4">Or continue with</Text>
                            <View className="flex-row justify-center space-x-4 gap-4">
                                <TouchableOpacity className="w-14 h-14 bg-white border border-gray-200 rounded-full items-center justify-center">
                                    <Text className="font-bold text-xl">G</Text>
                                </TouchableOpacity>
                                <TouchableOpacity className="w-14 h-14 bg-white border border-gray-200 rounded-full items-center justify-center">
                                    <Text className="font-bold text-xl"></Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
