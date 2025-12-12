import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Award, Calendar, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Club, clubService } from '../../../services/club.service';

export default function ClubDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [club, setClub] = useState<Club | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadClubDetail();
        }
    }, [id]);

    const loadClubDetail = async () => {
        try {
            setLoading(true);
            const data = await clubService.getClubDetail(id as string);
            setClub(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#0000ff" />
            </SafeAreaView>
        );
    }

    if (!club) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center">
                <Text>Club not found</Text>
            </SafeAreaView>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <Image
                source={{ uri: club.logoUrl || 'https://via.placeholder.com/300' }}
                className="w-full h-64"
                resizeMode="cover"
            />
            <View className="absolute top-0 left-0 w-full h-64 bg-black/30" />

            <SafeAreaView className="absolute top-0 left-0 w-full p-4">
                <TouchableOpacity
                    className="w-10 h-10 bg-white/20 rounded-full items-center justify-center backdrop-blur-md border border-white/30"
                    onPress={() => router.back()}
                >
                    <ArrowLeft size={24} color="#FFF" />
                </TouchableOpacity>
            </SafeAreaView>

            <ScrollView className="flex-1 -mt-6 bg-white rounded-t-3xl px-6 pt-8">
                <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                        {/* <Text className="text-primary font-bold text-sm uppercase mb-1">{club.category}</Text> */}
                        <Text className="text-3xl font-bold text-gray-900 mb-2">{club.name}</Text>
                    </View>
                </View>

                <View className="flex-row items-center mb-8 space-x-4">
                    <View className="flex-row items-center bg-gray-100 px-3 py-1 rounded-full">
                        <Users size={14} color="#4B5563" />
                        <Text className="text-gray-600 text-sm ml-1 font-medium">{/* {club.members} */} 0 Members</Text>
                    </View>
                    <View className="flex-row items-center bg-gray-100 px-3 py-1 rounded-full ml-2">
                        <Calendar size={14} color="#4B5563" />
                        <Text className="text-gray-600 text-sm ml-1 font-medium">Active</Text>
                    </View>
                </View>

                <Text className="text-lg font-bold text-gray-900 mb-3">About Us</Text>
                <Text className="text-gray-600 leading-7 mb-8 text-base">{club.description || 'No description available.'}</Text>

                <Text className="text-lg font-bold text-gray-900 mb-3">Why Join Us?</Text>
                <View className="space-y-3 mb-24">
                    <View className="flex-row items-start">
                        <Award size={20} color="#4F46E5" className="mt-1" />
                        <Text className="text-gray-600 ml-3 flex-1 leading-6">Participate in exclusive workshops and events.</Text>
                    </View>
                    <View className="flex-row items-start mt-3">
                        <Users size={20} color="#4F46E5" className="mt-1" />
                        <Text className="text-gray-600 ml-3 flex-1 leading-6">Network with like-minded students and alumni.</Text>
                    </View>
                </View>
            </ScrollView>

            <View className="absolute bottom-0 w-full p-6 bg-white border-t border-gray-100 shadow-lg">
                {club.membershipFeeAmount > 0 && (
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-gray-500">Membership Fee</Text>
                        <Text className="text-xl font-bold text-primary">{club.membershipFeeAmount.toLocaleString()} VND</Text>
                    </View>
                )}
                <TouchableOpacity
                    className="w-full bg-primary py-4 rounded-xl items-center shadow-md shadow-indigo-200"
                    onPress={() => router.push({ pathname: '/(student)/clubs/apply', params: { clubId: club.id, clubName: club.name, fee: club.membershipFeeAmount } })}
                >
                    <Text className="text-white font-bold text-lg">
                        {club.membershipFeeAmount === 0 ? 'Apply Now (Free)' : 'Apply for Interview'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
