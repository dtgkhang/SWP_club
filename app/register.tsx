import { useRouter } from 'expo-router';
import { ArrowLeft, CreditCard, GraduationCap, Lock, Mail, Phone, User } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useToast } from '../contexts/ToastContext';
import { authService } from '../services/auth.service';

export default function RegisterScreen() {
    const router = useRouter();
    const { showSuccess, showError, showWarning } = useToast();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [studentCode, setStudentCode] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!email || !password || !fullName || !studentCode) {
            showWarning('Missing Fields', 'Please fill in all required fields');
            return;
        }

        if (password.length < 6) {
            showWarning('Weak Password', 'Password must be at least 6 characters');
            return;
        }

        try {
            setLoading(true);
            await authService.register({
                email,
                password,
                fullName,
                studentCode,
                phone
            });
            showSuccess('Registration Successful', 'Please login with your new account');
            router.back();
        } catch (error: any) {
            showError('Registration Failed', error.message || 'Could not create account');
        } finally {
            setLoading(false);
        }
    };

    const InputField = ({ icon: Icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize }: any) => (
        <View className="mb-4">
            <View className="flex-row items-center bg-background border border-border rounded-xl px-4 h-14">
                <Icon size={20} color="#64748B" />
                <TextInput
                    className="flex-1 ml-3 text-text text-base"
                    placeholder={placeholder}
                    placeholderTextColor="#94A3B8"
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                />
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-background">
            {/* Header */}
            <View className="bg-primary pt-16 pb-12 px-6 rounded-b-[40px]">
                <SafeAreaView edges={['top']}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center mb-6 backdrop-blur"
                    >
                        <ArrowLeft size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text className="text-white text-3xl font-bold">Create Account</Text>
                    <Text className="text-white/80 text-base mt-2">Join FPTU CLUB community</Text>
                </SafeAreaView>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1 -mt-6"
                keyboardVerticalOffset={Platform.OS === 'ios' ? -30 : 0}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                    className="px-6"
                >
                    <View className="bg-card rounded-3xl p-6 shadow-sm border border-border">
                        <InputField
                            icon={Mail}
                            placeholder="Email Address (*)"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <InputField
                            icon={Lock}
                            placeholder="Password (*)"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoCapitalize="none"
                        />
                        <InputField
                            icon={User}
                            placeholder="Full Name (*)"
                            value={fullName}
                            onChangeText={setFullName}
                            autoCapitalize="words"
                        />
                        <InputField
                            icon={CreditCard}
                            placeholder="Student ID (*)"
                            value={studentCode}
                            onChangeText={setStudentCode}
                            autoCapitalize="characters"
                        />
                        <InputField
                            icon={Phone}
                            placeholder="Phone Number"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />

                        <TouchableOpacity
                            className="w-full bg-primary h-14 rounded-xl items-center justify-center shadow-sm mt-4"
                            onPress={handleRegister}
                            disabled={loading}
                            style={{ opacity: loading ? 0.7 : 1 }}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text className="text-white font-bold text-base">Register</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row justify-center mt-6">
                        <Text className="text-text-secondary">Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Text className="text-primary font-bold">Login</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
