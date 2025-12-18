import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, GraduationCap, Lock, Mail, Sparkles } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { useToast } from '../contexts/ToastContext';
import { authService } from '../services/auth.service';

WebBrowser.maybeCompleteAuthSession();

// Google OAuth Client IDs - Get from https://console.cloud.google.com/apis/credentials
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';

export default function LoginScreen() {
    const router = useRouter();
    const { showSuccess, showError, showWarning } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    // Google Auth - Platform-specific client IDs
    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: GOOGLE_WEB_CLIENT_ID,
        iosClientId: GOOGLE_IOS_CLIENT_ID || GOOGLE_WEB_CLIENT_ID,
        androidClientId: GOOGLE_ANDROID_CLIENT_ID || GOOGLE_WEB_CLIENT_ID,
    });

    // Handle Google response
    useEffect(() => {
        if (response?.type === 'success') {
            handleGoogleSuccess(response);
        }
    }, [response]);

    const handleGoogleSuccess = async (response: any) => {
        try {
            setGoogleLoading(true);
            const accessToken = response.authentication?.accessToken;
            if (!accessToken) {
                showError('Error', 'Failed to get Google access token');
                return;
            }

            // Get email from Google
            const userInfoRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            const userInfo = await userInfoRes.json();

            // Validate FPT email
            if (!userInfo.email?.endsWith('@fpt.edu.vn')) {
                showError('Invalid Account', 'Please use your @fpt.edu.vn email');
                return;
            }

            // Send to BE
            await authService.loginWithGoogle(userInfo.email);
            showSuccess('Welcome!', 'Login successful');
            router.replace('/(student)/home');
        } catch (error: any) {
            showError('Login Failed', error.message || 'Account not found');
        } finally {
            setGoogleLoading(false);
        }
    };

    useEffect(() => {
        checkExistingAuth();
    }, []);

    const checkExistingAuth = async () => {
        try {
            const isLoggedIn = await authService.checkAuth();
            if (isLoggedIn) {
                await authService.getProfile();
                router.replace('/(student)/home');
            }
        } catch (error) { }
        finally { setCheckingAuth(false); }
    };

    const handleLogin = async () => {
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedPassword = password.trim();

        if (!trimmedEmail || !trimmedPassword) {
            showWarning('Missing Fields', 'Please enter email and password');
            return;
        }
        if (!trimmedEmail.endsWith('@fpt.edu.vn')) {
            showWarning('Invalid Email', 'Please use your @fpt.edu.vn email');
            return;
        }

        try {
            setLoading(true);
            await authService.login(trimmedEmail, trimmedPassword);
            showSuccess('Welcome!', 'Login successful');
            router.replace('/(student)/home');
        } catch (error: any) {
            showError('Login Failed', error.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    if (checkingAuth) {
        return (
            <View className="flex-1 justify-center items-center" style={{ backgroundColor: COLORS.primary }}>
                <View className="items-center">
                    <View className="w-24 h-24 bg-white/20 rounded-3xl items-center justify-center mb-6">
                        <GraduationCap size={56} color="#FFFFFF" />
                    </View>
                    <Text className="text-white text-3xl font-extrabold">FPTU CLUB</Text>
                    <ActivityIndicator color="#FFF" style={{ marginTop: 32 }} size="large" />
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1" style={{ backgroundColor: COLORS.primary }}>
            <SafeAreaView className="flex-1" edges={['top']}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                    <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                        {/* Header */}
                        <View className="items-center pt-10 pb-8 px-6">
                            <View className="w-20 h-20 rounded-3xl items-center justify-center mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                                <GraduationCap size={48} color="#FFFFFF" />
                            </View>
                            <Text className="text-white text-3xl font-extrabold">FPTU CLUB</Text>
                            <Text className="text-white/70 text-base mt-1">University Club Management</Text>
                        </View>

                        {/* Login Card */}
                        <View className="flex-1 bg-white rounded-t-[40px] px-6 pt-8 pb-10">
                            <View className="items-center mb-8">
                                <View className="flex-row items-center mb-2">
                                    <Sparkles size={20} color={COLORS.primary} />
                                    <Text className="text-text text-2xl font-bold ml-2">Welcome Back!</Text>
                                </View>
                                <Text className="text-text-secondary">Sign in to continue to your clubs</Text>
                            </View>

                            {/* Email */}
                            <View className="mb-4">
                                <Text className="text-text font-semibold mb-2 text-sm">Email Address</Text>
                                <View className="flex-row items-center rounded-2xl px-4 h-14" style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }}>
                                    <Mail size={20} color="#94A3B8" />
                                    <TextInput className="flex-1 ml-3 text-text text-base" placeholder="student@fpt.edu.vn" placeholderTextColor="#94A3B8" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                                </View>
                            </View>

                            {/* Password */}
                            <View className="mb-4">
                                <Text className="text-text font-semibold mb-2 text-sm">Password</Text>
                                <View className="flex-row items-center rounded-2xl px-4 h-14" style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }}>
                                    <Lock size={20} color="#94A3B8" />
                                    <TextInput className="flex-1 ml-3 text-text text-base" placeholder="••••••••" placeholderTextColor="#94A3B8" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff size={20} color="#94A3B8" /> : <Eye size={20} color="#94A3B8" />}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Sign In */}
                            <TouchableOpacity className="w-full h-14 rounded-2xl items-center justify-center mt-4" style={{ backgroundColor: COLORS.primary }} onPress={handleLogin} disabled={loading}>
                                {loading ? <ActivityIndicator color="#FFF" /> : <Text className="text-white font-bold text-base">Sign In</Text>}
                            </TouchableOpacity>

                            {/* Google - Only show if client ID is configured */}
                            {GOOGLE_WEB_CLIENT_ID && GOOGLE_WEB_CLIENT_ID.includes('.apps.googleusercontent.com') && (
                                <>
                                    {/* Divider */}
                                    <View className="flex-row items-center my-6">
                                        <View className="flex-1 h-px bg-gray-200" />
                                        <Text className="text-gray-400 text-xs mx-4">OR</Text>
                                        <View className="flex-1 h-px bg-gray-200" />
                                    </View>

                                    <TouchableOpacity
                                        className="w-full h-14 rounded-2xl flex-row items-center justify-center"
                                        style={{ backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E5E7EB' }}
                                        onPress={() => promptAsync()}
                                        disabled={!request || googleLoading}
                                    >
                                        {googleLoading ? (
                                            <ActivityIndicator color={COLORS.primary} />
                                        ) : (
                                            <>
                                                <Image source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }} style={{ width: 24, height: 24, marginRight: 12 }} />
                                                <Text className="text-gray-700 font-bold text-base">Continue with Google</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </>
                            )}

                            <View className="mt-8 items-center">
                                <Text className="text-gray-400 text-xs text-center">Only @fpt.edu.vn emails are allowed</Text>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
