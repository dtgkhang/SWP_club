import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Heart, MapPin, Share2, Sparkles, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/theme';
import { Club, clubService } from '../../../services/club.service';

const { width } = Dimensions.get('window');

export default function ClubDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [club, setClub] = useState<Club | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) loadClubDetail();
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
            <View className="flex-1 bg-background justify-center items-center">
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!club) {
        return (
            <View className="flex-1 bg-background justify-center items-center">
                <Text className="text-text-secondary">Club not found</Text>
            </View>
        );
    }

    const fee = club.membershipFeeAmount ?? 0;

    return (
        <View className="flex-1 bg-background">
            {/* Hero Image */}
            <View className="relative">
                <Image
                    source={{ uri: club.logoUrl || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800' }}
                    style={{ width, height: 260 }}
                    resizeMode="cover"
                />
                <View className="absolute inset-0 bg-black/30" />

                {/* Header Buttons */}
                <SafeAreaView className="absolute top-0 left-0 right-0 px-4 pt-2">
                    <View className="flex-row justify-between items-center">
                        <TouchableOpacity
                            className="w-11 h-11 bg-white/90 rounded-xl items-center justify-center"
                            onPress={() => router.back()}
                        >
                            <ArrowLeft size={22} color={COLORS.text} />
                        </TouchableOpacity>
                        <View className="flex-row">
                            <TouchableOpacity className="w-11 h-11 bg-white/90 rounded-xl items-center justify-center mr-2">
                                <Heart size={20} color={COLORS.text} />
                            </TouchableOpacity>
                            <TouchableOpacity className="w-11 h-11 bg-white/90 rounded-xl items-center justify-center">
                                <Share2 size={20} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </View>

            {/* Content */}
            <ScrollView
                className="flex-1 -mt-8 bg-background rounded-t-3xl"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 140 }}
            >
                <View className="px-5 pt-6">
                    {/* Club Info */}
                    <Text className="text-text text-2xl font-bold mb-3">{club.name}</Text>

                    {/* Stats Row */}
                    <View className="flex-row mb-5">
                        <View className="bg-secondary-soft px-4 py-2.5 rounded-xl flex-row items-center mr-3">
                            <Users size={16} color={COLORS.secondary} />
                            <Text className="text-secondary font-bold ml-2">{club._count?.memberships || 0} members</Text>
                        </View>
                        <View className="bg-primary-soft px-4 py-2.5 rounded-xl flex-row items-center">
                            <Sparkles size={16} color={COLORS.primary} />
                            <Text className="text-primary font-bold ml-2">{club._count?.events || 0} events</Text>
                        </View>
                    </View>

                    {/* Leader Card */}
                    {club.leader && (
                        <View className="bg-card border border-border rounded-2xl p-4 mb-5">
                            <Text className="text-text-secondary text-xs font-medium uppercase mb-3">Club Leader</Text>
                            <View className="flex-row items-center">
                                <View className="w-14 h-14 bg-secondary rounded-xl items-center justify-center mr-4">
                                    <Text className="text-white font-bold text-xl">
                                        {club.leader.fullName?.charAt(0) || 'L'}
                                    </Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-text font-bold text-base">{club.leader.fullName || 'Unknown'}</Text>
                                    <Text className="text-text-secondary text-sm">{club.leader.email}</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* About */}
                    <View className="mb-5">
                        <Text className="text-text font-bold text-lg mb-3">About</Text>
                        <Text className="text-text-secondary leading-6">
                            {club.description || 'Welcome to our club! We are a passionate community dedicated to learning and growing together. Join us to connect with like-minded students and participate in exciting activities.'}
                        </Text>
                    </View>

                    {/* Social/Contact placeholder */}
                    <View className="bg-card border border-border rounded-2xl p-4">
                        <Text className="text-text-secondary text-xs font-medium uppercase mb-3">Contact & Social</Text>
                        <View className="flex-row">
                            <View className="w-10 h-10 bg-secondary-soft rounded-full items-center justify-center mr-2">
                                <Text className="text-secondary font-bold">f</Text>
                            </View>
                            <View className="w-10 h-10 bg-info-soft rounded-full items-center justify-center mr-2">
                                <Text className="text-info font-bold">@</Text>
                            </View>
                            <View className="w-10 h-10 bg-danger-soft rounded-full items-center justify-center">
                                <Text className="text-danger font-bold">✉</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom CTA */}
            <View className="absolute bottom-0 left-0 right-0 bg-card border-t border-border px-5 pt-4 pb-8">
                {fee > 0 && (
                    <View className="flex-row justify-between items-center mb-3">
                        <Text className="text-text-secondary">Membership Fee</Text>
                        <Text className="text-primary text-xl font-bold">{fee.toLocaleString()}₫</Text>
                    </View>
                )}
                <TouchableOpacity
                    className="w-full bg-primary py-4 rounded-2xl items-center"
                    onPress={() => router.push({
                        pathname: '/(student)/clubs/apply',
                        params: { clubId: club.id, clubName: club.name, fee }
                    })}
                >
                    <Text className="text-white font-bold text-base">
                        {fee === 0 ? 'Join Club - Free' : 'Apply to Join'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
