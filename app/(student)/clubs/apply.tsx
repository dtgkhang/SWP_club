import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ClubApplication() {
    const { clubName, type, fee } = useLocalSearchParams();
    const router = useRouter();
    const [studentId, setStudentId] = useState('');
    const [reason, setReason] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
        if (!studentId || !reason) {
            // Keep Alert for validation error as it's simple
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        setSubmitted(true);

        // Simulate API call
        setTimeout(() => {
            // After the "sending" phase, the `submitted` state remains true
            // to display the success message.
            // No need to change `submitted` here, as it's already true.
            // The success view will be rendered because `submitted` is true.
        }, 1500);
    };

    if (submitted) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center p-6">
                <View className="items-center">
                    <CheckCircle size={80} color="#10B981" />
                    <Text className="text-2xl font-bold text-gray-900 mt-6 mb-2">
                        {type === 'PAID' ? 'Application Received' : 'Application Sent'}
                    </Text>
                    <Text className="text-gray-500 text-center mb-8 leading-6">
                        {type === 'PAID'
                            ? `We have received your application to ${clubName}. You will be contacted for an interview. Membership fee: ${Number(fee).toLocaleString()} VND.`
                            : `Your application to ${clubName} has been submitted successfully! You will be notified once approved.`}
                    </Text>
                    <TouchableOpacity
                        className="bg-primary px-8 py-3 rounded-full shadow-md shadow-indigo-200"
                        onPress={() => router.navigate('/(student)/clubs')}
                    >
                        <Text className="text-white font-bold">Back to Clubs</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="p-4 flex-row items-center border-b border-gray-200 bg-white">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <ArrowLeft size={24} color="#000" />
                </TouchableOpacity>
                <Text className="text-lg font-bold" numberOfLines={1}>Apply to {clubName}</Text>
            </View>

            <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
                <View className="bg-white p-6 rounded-2xl shadow-sm shadow-gray-200 mb-6">
                    <Text className="text-gray-500 mb-6">
                        Please fill out the form below to apply for membership. The club leader will review your application.
                    </Text>

                    <View className="mb-4">
                        <Text className="text-gray-700 font-medium mb-2">Student ID</Text>
                        <TextInput
                            className="bg-gray-50 p-4 rounded-xl text-gray-900 border border-gray-200"
                            placeholder="e.g. SE123456"
                            value={studentId}
                            onChangeText={setStudentId}
                        />
                    </View>

                    <View className="mb-6">
                        <Text className="text-gray-700 font-medium mb-2">Why do you want to join?</Text>
                        <TextInput
                            className="bg-gray-50 p-4 rounded-xl text-gray-900 border border-gray-200 h-32"
                            placeholder="Tell us about your interest and skills..."
                            multiline
                            textAlignVertical="top"
                            value={reason}
                            onChangeText={setReason}
                        />
                    </View>

                    <TouchableOpacity
                        className="w-full bg-primary py-4 rounded-xl items-center shadow-md shadow-indigo-200"
                        onPress={handleSubmit}
                    >
                        <Text className="text-white font-bold text-lg">Submit Application</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
