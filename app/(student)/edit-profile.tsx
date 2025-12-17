import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Check, User } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { useToast } from '../../contexts/ToastContext';
import { authService } from '../../services/auth.service';
import api from '../../services/api';

export default function EditProfileScreen() {
    const router = useRouter();
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [studentCode, setStudentCode] = useState('');
    const [originalData, setOriginalData] = useState<any>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const { user } = await authService.getProfile();
            setFullName(user?.fullName || '');
            setPhone(user?.phone || '');
            setStudentCode(user?.studentCode || '');
            setOriginalData({
                fullName: user?.fullName || '',
                phone: user?.phone || '',
                studentCode: user?.studentCode || ''
            });
        } catch (error) {
            showError('Error', 'Could not load profile');
        } finally {
            setLoading(false);
        }
    };

    const hasChanges = () => {
        if (!originalData) return false;
        return fullName !== originalData.fullName ||
            phone !== originalData.phone ||
            studentCode !== originalData.studentCode;
    };

    const handleSave = async () => {
        if (!fullName.trim()) {
            showError('Error', 'Full name is required');
            return;
        }

        try {
            setSaving(true);
            await api('/users/profile', {
                method: 'PATCH',
                body: JSON.stringify({
                    fullName: fullName.trim(),
                    phone: phone.trim() || undefined,
                    studentCode: studentCode.trim() || undefined
                })
            });
            showSuccess('Success', 'Profile updated successfully!');
            router.back();
        } catch (error: any) {
            showError('Error', error.message || 'Could not update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 bg-background justify-center items-center">
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-4 bg-card border-b border-border">
                <TouchableOpacity onPress={() => router.back()} className="p-1">
                    <ArrowLeft size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text className="text-text text-lg font-bold">Edit Profile</Text>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={!hasChanges() || saving}
                    className="p-1"
                    style={{ opacity: hasChanges() && !saving ? 1 : 0.5 }}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                        <Check size={24} color={COLORS.primary} />
                    )}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            >
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    {/* Avatar Section */}
                    <View className="items-center py-8">
                        <View className="relative">
                            <View className="w-24 h-24 bg-primary-soft rounded-3xl items-center justify-center">
                                <Text className="text-primary text-4xl font-bold">
                                    {(fullName || 'U').charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <TouchableOpacity className="absolute bottom-0 right-0 bg-primary w-8 h-8 rounded-full items-center justify-center border-2 border-background">
                                <Camera size={16} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                        <Text className="text-text-secondary text-sm mt-3">Tap to change photo</Text>
                    </View>

                    {/* Form */}
                    <View className="px-5">
                        {/* Full Name */}
                        <View className="mb-4">
                            <Text className="text-text font-medium mb-2">Full Name *</Text>
                            <TextInput
                                className="bg-card border border-border rounded-xl px-4 py-3.5 text-text"
                                placeholder="Enter your full name"
                                placeholderTextColor={COLORS.textLight}
                                value={fullName}
                                onChangeText={setFullName}
                            />
                        </View>

                        {/* Phone */}
                        <View className="mb-4">
                            <Text className="text-text font-medium mb-2">Phone Number</Text>
                            <TextInput
                                className="bg-card border border-border rounded-xl px-4 py-3.5 text-text"
                                placeholder="Enter your phone number"
                                placeholderTextColor={COLORS.textLight}
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                            />
                        </View>

                        {/* Student Code */}
                        <View className="mb-4">
                            <Text className="text-text font-medium mb-2">Student Code</Text>
                            <TextInput
                                className="bg-card border border-border rounded-xl px-4 py-3.5 text-text"
                                placeholder="e.g. SE170001"
                                placeholderTextColor={COLORS.textLight}
                                value={studentCode}
                                onChangeText={setStudentCode}
                                autoCapitalize="characters"
                            />
                        </View>

                        {/* Info */}
                        <View className="bg-secondary-soft border border-secondary/20 rounded-xl p-4 mt-4 mb-8">
                            <Text className="text-secondary text-sm">
                                💡 Your email cannot be changed. Contact support if you need help.
                            </Text>
                        </View>

                        {/* Save Button */}
                        <TouchableOpacity
                            className="bg-primary py-4 rounded-xl items-center mb-8"
                            onPress={handleSave}
                            disabled={!hasChanges() || saving}
                            style={{ opacity: hasChanges() && !saving ? 1 : 0.5 }}
                        >
                            {saving ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text className="text-white font-bold text-base">Save Changes</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
