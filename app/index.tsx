import { useRouter } from 'expo-router';
import { Eye, EyeOff, GraduationCap, Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../services/auth.service';

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            alert('Please enter email and password');
            return;
        }

        try {
            setLoading(true);
            const response = await authService.login(email, password);
            console.log('Login success:', response);
            router.replace('/(student)/home');
        } catch (error: any) {
            alert(error.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-background">
            {/* Header with gradient-like effect */}
            <View className="bg-primary pt-16 pb-24 px-6 rounded-b-[40px]">
                <SafeAreaView edges={['top']}>
                    <View className="items-center">
                        <View className="w-20 h-20 bg-white/20 rounded-2xl items-center justify-center mb-4 backdrop-blur">
                            <GraduationCap size={44} color="#FFFFFF" />
                        </View>
                        <Text className="text-white text-2xl font-bold">FPT UCMS</Text>
                        <Text className="text-white/80 text-sm mt-1">University Club Management System</Text>
                    </View>
                </SafeAreaView>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1 -mt-12"
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                    className="px-6"
                >
                    {/* Login Card */}
                    <View className="bg-card rounded-3xl p-6 shadow-sm border border-border">
                        <Text className="text-text text-xl font-bold mb-1">Welcome Back!</Text>
                        <Text className="text-text-secondary text-sm mb-6">Sign in to continue</Text>

                        {/* Email Input */}
                        <View className="mb-4">
                            <Text className="text-text font-medium mb-2 text-sm">Email Address</Text>
                            <View className="flex-row items-center bg-background border border-border rounded-xl px-4 h-14">
                                <Mail size={20} color="#64748B" />
                                <TextInput
                                    className="flex-1 ml-3 text-text text-base"
                                    placeholder="student@fpt.edu.vn"
                                    placeholderTextColor="#94A3B8"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>
                        </View>

                        {/* Password Input */}
                        <View className="mb-4">
                            <Text className="text-text font-medium mb-2 text-sm">Password</Text>
                            <View className="flex-row items-center bg-background border border-border rounded-xl px-4 h-14">
                                <Lock size={20} color="#64748B" />
                                <TextInput
                                    className="flex-1 ml-3 text-text text-base"
                                    placeholder="••••••••"
                                    placeholderTextColor="#94A3B8"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    {showPassword ? (
                                        <EyeOff size={20} color="#64748B" />
                                    ) : (
                                        <Eye size={20} color="#64748B" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Forgot Password */}
                        <TouchableOpacity className="items-end mb-6">
                            <Text className="text-secondary font-medium text-sm">Forgot Password?</Text>
                        </TouchableOpacity>

                        {/* Login Button */}
                        <TouchableOpacity
                            className="w-full bg-primary h-14 rounded-xl items-center justify-center shadow-sm"
                            onPress={handleLogin}
                            disabled={loading}
                            style={{ opacity: loading ? 0.7 : 1 }}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text className="text-white font-bold text-base">Sign In</Text>
                            )}
                        </TouchableOpacity>

                        {/* Divider */}
                        <View className="flex-row items-center my-6">
                            <View className="flex-1 h-px bg-border" />
                            <Text className="text-textLight text-xs mx-4">OR</Text>
                            <View className="flex-1 h-px bg-border" />
                        </View>

                        {/* Social Login */}
                        <View className="flex-row justify-center gap-4">
                            <TouchableOpacity className="w-14 h-14 bg-background border border-border rounded-xl items-center justify-center">
                                <Text className="font-bold text-lg text-text">G</Text>
                            </TouchableOpacity>
                            <TouchableOpacity className="w-14 h-14 bg-secondary rounded-xl items-center justify-center">
                                <Text className="font-bold text-lg text-white">f</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Register Link */}
                    <View className="flex-row justify-center mt-6 mb-8">
                        <Text className="text-text-secondary">Don't have an account? </Text>
                        <TouchableOpacity>
                            <Text className="text-primary font-bold">Register</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
