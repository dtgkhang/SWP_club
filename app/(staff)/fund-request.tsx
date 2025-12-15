import { useRouter } from 'expo-router';
import { CheckCircle, Upload } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FundRequestScreen() {
    const router = useRouter();
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
        if (!amount || !reason) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            setAmount('');
            setReason('');
            Alert.alert('Success', 'Request submitted successfully!');
        }, 2000);
    };

    if (submitted) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center p-6">
                <CheckCircle size={80} color="#10B981" />
                <Text className="text-2xl font-bold text-gray-900 mt-6 mb-2">Request Submitted</Text>
                <Text className="text-gray-500 text-center">Your fund request has been sent to the Treasurer for approval.</Text>
                <TouchableOpacity
                    className="mt-8 bg-gray-100 px-6 py-3 rounded-xl"
                    onPress={() => setSubmitted(false)}
                >
                    <Text className="text-gray-700 font-bold">Create New Request</Text>
                </TouchableOpacity>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50 p-4">
            <Text className="text-2xl font-bold text-gray-900 mb-6">Create Fund Request</Text>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View className="bg-white p-6 rounded-2xl shadow-sm shadow-gray-200 mb-6">
                        <View className="mb-4">
                            <Text className="text-gray-700 font-medium mb-2">Amount (VND)</Text>
                            <TextInput
                                className="bg-gray-50 p-4 rounded-xl text-lg font-bold text-gray-900 border border-gray-200"
                                placeholder="0"
                                keyboardType="numeric"
                                value={amount}
                                onChangeText={setAmount}
                            />
                        </View>

                        <View className="mb-6">
                            <Text className="text-gray-700 font-medium mb-2">Reason / Description</Text>
                            <TextInput
                                className="bg-gray-50 p-4 rounded-xl text-gray-900 border border-gray-200 h-32"
                                placeholder="e.g. Buying water for event..."
                                multiline
                                textAlignVertical="top"
                                value={reason}
                                onChangeText={setReason}
                            />
                        </View>

                        <View className="mb-6">
                            <Text className="text-gray-700 font-medium mb-2">Evidence (Invoice/Quote)</Text>
                            <TouchableOpacity className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl h-40 items-center justify-center">
                                <Upload size={32} color="#9CA3AF" />
                                <Text className="text-gray-400 mt-2">Tap to upload image</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            className="w-full bg-green-600 py-4 rounded-xl items-center shadow-md shadow-green-200"
                            onPress={handleSubmit}
                        >
                            <Text className="text-white font-bold text-lg">Submit Request</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
