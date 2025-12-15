import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Crown, Heart, Share2, Sparkles, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/theme';
import { useToast } from '../../../contexts/ToastContext';
import { authService } from '../../../services/auth.service';
import { Club, clubService } from '../../../services/club.service';

const { width } = Dimensions.get('window');

interface Member {
    id: string;
    role: string;
    status: string;
    user: {
        id: string;
        fullName: string;
        email: string;
    };
}

export default function ClubDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { showError, showSuccess } = useToast();
    const [club, setClub] = useState<Club | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [isUserMember, setIsUserMember] = useState(false);
    const [checkingMembership, setCheckingMembership] = useState(true);

    useEffect(() => {
        if (id) {
            loadClubDetail();
        }
    }, [id]);

    const checkMembership = async (clubId: string) => {
        try {
            setCheckingMembership(true);
            const { user } = await authService.getProfile();
            const userClubIds = (user?.memberships || [])
                .filter((m: any) => m.status === 'ACTIVE')
                .map((m: any) => m.clubId);
            const isMember = userClubIds.includes(clubId);
            setIsUserMember(isMember);

            // Load members if user is a member
            if (isMember) {
                loadMembers(clubId);
            }
        } catch (error) {
            setIsUserMember(false);
        } finally {
            setCheckingMembership(false);
        }
    };

    const loadClubDetail = async () => {
        try {
            setLoading(true);
            const data = await clubService.getClubDetail(id as string);
            setClub(data);

            // Check membership using actual club.id (UUID)
            if (data?.id) {
                checkMembership(data.id);
            }
        } catch (error: any) {
            showError('Error', 'Could not load club details');
        } finally {
            setLoading(false);
        }
    };

    const loadMembers = async (clubId: string) => {
        try {
            setLoadingMembers(true);
            const data = await clubService.getClubMembers(clubId);
            setMembers(data);
        } catch (error) {
            console.log('Could not load members:', error);
        } finally {
            setLoadingMembers(false);
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'LEADER': return { bg: 'bg-primary-soft', text: 'text-primary' };
            case 'TREASURER': return { bg: 'bg-success-soft', text: 'text-success' };
            case 'STAFF': return { bg: 'bg-secondary-soft', text: 'text-secondary' };
            default: return { bg: 'bg-background', text: 'text-text-secondary' };
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
                    style={{ width, height: 240 }}
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

                {/* Member Badge */}
                {isUserMember && (
                    <View className="absolute bottom-4 left-4 bg-success px-4 py-2 rounded-xl">
                        <Text className="text-white font-bold">Member</Text>
                    </View>
                )}
            </View>

            {/* Content */}
            <ScrollView
                className="flex-1 -mt-6 bg-background rounded-t-3xl"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: isUserMember ? 30 : 140 }}
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
                                <View className="w-12 h-12 bg-primary rounded-xl items-center justify-center mr-3">
                                    <Crown size={20} color="#FFF" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-text font-bold">{club.leader.fullName || 'Unknown'}</Text>
                                    <Text className="text-text-secondary text-sm">{club.leader.email}</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* About */}
                    <View className="mb-5">
                        <Text className="text-text font-bold text-lg mb-3">About</Text>
                        <Text className="text-text-secondary leading-6">
                            {club.description || 'Welcome to our club! We are a community dedicated to learning and growing together.'}
                        </Text>
                    </View>

                    {/* Members List - Only for joined clubs */}
                    {isUserMember && (
                        <View className="mb-5">
                            <Text className="text-text font-bold text-lg mb-3">Members ({members.length})</Text>

                            {loadingMembers ? (
                                <ActivityIndicator color={COLORS.primary} />
                            ) : members.length > 0 ? (
                                <View className="bg-card border border-border rounded-2xl overflow-hidden">
                                    {members.map((member, index) => {
                                        const roleStyle = getRoleBadgeColor(member.role);
                                        return (
                                            <View
                                                key={member.id}
                                                className={`p-4 flex-row items-center ${index !== members.length - 1 ? 'border-b border-border' : ''}`}
                                            >
                                                <View className="w-10 h-10 bg-secondary-soft rounded-full items-center justify-center mr-3">
                                                    <Text className="text-secondary font-bold">
                                                        {member.user.fullName?.charAt(0) || '?'}
                                                    </Text>
                                                </View>
                                                <View className="flex-1">
                                                    <Text className="text-text font-medium">{member.user.fullName}</Text>
                                                    <Text className="text-text-secondary text-xs">{member.user.email}</Text>
                                                </View>
                                                <View className={`px-2 py-1 rounded ${roleStyle.bg}`}>
                                                    <Text className={`text-xs font-bold ${roleStyle.text}`}>{member.role}</Text>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            ) : (
                                <View className="bg-card border border-border rounded-2xl p-6 items-center">
                                    <Text className="text-text-secondary">No members found</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Bottom CTA - Show for non-members */}
            {!isUserMember && !checkingMembership && club && (
                <SafeAreaView
                    edges={['bottom']}
                    className="bg-card border-t border-border px-5 pt-4"
                    style={{ paddingBottom: 90 }}
                >
                    {fee > 0 && (
                        <View className="flex-row justify-between items-center mb-3">
                            <Text className="text-text-secondary">Membership Fee</Text>
                            <Text className="text-primary text-xl font-bold">{fee.toLocaleString()}₫</Text>
                        </View>
                    )}
                    <TouchableOpacity
                        className="w-full bg-primary py-4 rounded-2xl items-center"
                        onPress={() => router.push({
                            pathname: '/(student)/clubs/apply' as any,
                            params: { clubId: club.id, clubName: club.name, fee: String(fee) }
                        })}
                    >
                        <Text className="text-white font-bold text-base">
                            {fee === 0 ? 'Join Club - Free' : 'Apply to Join'}
                        </Text>
                    </TouchableOpacity>
                </SafeAreaView>
            )}
        </View>
    );
}
