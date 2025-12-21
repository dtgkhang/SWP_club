import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, CheckCircle, ChevronRight, Clock, Crown, Heart, MapPin, Share2, Sparkles, Star, Users, Video } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/theme';
import { useToast } from '../../../contexts/ToastContext';
import { authService } from '../../../services/auth.service';
import { Event, eventService } from '../../../services/event.service';
import { Club, clubService } from '../../../services/club.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const EVENT_CARD_WIDTH = SCREEN_WIDTH * 0.72;

interface Member {
    id: string;
    role: string;
    status: string;
    user: {
        id: string;
        fullName: string;
        email: string;
        studentCode?: string;
    };
}

export default function ClubDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { showError } = useToast();
    const [club, setClub] = useState<Club | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [isUserMember, setIsUserMember] = useState(false);
    const [checkingMembership, setCheckingMembership] = useState(true);
    const [checkingApplication, setCheckingApplication] = useState(true);
    const [hasPendingApplication, setHasPendingApplication] = useState(false);
    const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
    const [liked, setLiked] = useState(false);

    useEffect(() => {
        if (id) {
            // Reset state for new club
            setClub(null);
            setMembers([]);
            setEvents([]);
            setLoading(true);
            setIsUserMember(false);
            setCheckingMembership(true);
            setCheckingApplication(true);
            setHasPendingApplication(false);
            setApplicationStatus(null);
            setActiveTab('OVERVIEW');

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

            if (data?.id) {
                checkMembership(data.id);
                loadEvents(data.id);
                checkApplicationStatus(data.id);
            }
        } catch (error: any) {
            showError('Error', 'Could not load club details');
        } finally {
            setLoading(false);
        }
    };

    const loadEvents = async (clubId: string) => {
        try {
            const data = await eventService.getAllEvents({ clubId });
            setEvents(data);
        } catch (error) {
            console.log('Error loading events:', error);
        }
    };

    const checkApplicationStatus = async (clubId: string) => {
        try {
            setCheckingApplication(true);
            const { applications } = await clubService.getMyApplications(1, 50);

            // Check for PENDING application
            const pendingApp = applications.find(
                (app: any) => app.clubId === clubId && app.status === 'PENDING'
            );
            if (pendingApp) {
                setHasPendingApplication(true);
                setApplicationStatus('PENDING');
                return;
            }

            // Check for APPROVED application (may need payment)
            const approvedApp = applications.find(
                (app: any) => app.clubId === clubId && app.status === 'APPROVED'
            );
            if (approvedApp) {
                setApplicationStatus('APPROVED');
                // If club has membership fee, user needs to pay
                // The bottom bar will handle this case
                return;
            }

            // Check for REJECTED application (can re-apply)
            const rejectedApp = applications.find(
                (app: any) => app.clubId === clubId && app.status === 'REJECTED'
            );
            setApplicationStatus(rejectedApp ? 'REJECTED' : null);
        } catch (error) {
            console.log('Error checking application:', error);
        } finally {
            setCheckingApplication(false);
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

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'LEADER': return { bg: 'bg-primary', text: 'text-white', icon: Crown };
            case 'TREASURER': return { bg: 'bg-success', text: 'text-white', icon: Star };
            case 'STAFF': return { bg: 'bg-secondary', text: 'text-white', icon: Star };
            default: return { bg: 'bg-gray-200', text: 'text-text-secondary', icon: null };
        }
    };

    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'EVENTS' | 'MEMBERS'>('OVERVIEW');

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
                <Text className="text-text-secondary text-lg">Club not found</Text>
            </View>
        );
    }

    const fee = club.membershipFeeAmount ?? 0;
    const memberCount = club._count?.memberships || 0;
    const eventCount = club._count?.events || 0;

    const renderTabs = () => (
        <View className="flex-row px-5 mb-6">
            <TouchableOpacity
                onPress={() => setActiveTab('OVERVIEW')}
                className={`mr-4 px-4 py-2 rounded-full border ${activeTab === 'OVERVIEW' ? 'bg-primary border-primary' : 'bg-transparent border-transparent'}`}
            >
                <Text className={`font-bold ${activeTab === 'OVERVIEW' ? 'text-white' : 'text-text-secondary'}`}>Overview</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => setActiveTab('EVENTS')}
                className={`mr-4 px-4 py-2 rounded-full border ${activeTab === 'EVENTS' ? 'bg-primary border-primary' : 'bg-transparent border-transparent'}`}
            >
                <Text className={`font-bold ${activeTab === 'EVENTS' ? 'text-white' : 'text-text-secondary'}`}>Events</Text>
            </TouchableOpacity>
            {isUserMember && (
                <TouchableOpacity
                    onPress={() => setActiveTab('MEMBERS')}
                    className={`px-4 py-2 rounded-full border ${activeTab === 'MEMBERS' ? 'bg-primary border-primary' : 'bg-transparent border-transparent'}`}
                >
                    <Text className={`font-bold ${activeTab === 'MEMBERS' ? 'text-white' : 'text-text-secondary'}`}>Members</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderOverview = () => (
        <View className="px-5">
            {/* Stats Cards */}
            <View className="flex-row mb-6">
                <View className="flex-1 bg-secondary-soft p-4 rounded-2xl mr-3 items-center">
                    <Users size={24} color={COLORS.secondary} />
                    <Text className="text-secondary text-2xl font-bold mt-2">{memberCount}</Text>
                    <Text className="text-secondary/70 text-sm">Members</Text>
                </View>
                <View className="flex-1 bg-primary-soft p-4 rounded-2xl items-center">
                    <Sparkles size={24} color={COLORS.primary} />
                    <Text className="text-primary text-2xl font-bold mt-2">{eventCount}</Text>
                    <Text className="text-primary/70 text-sm">Events</Text>
                </View>
            </View>

            {/* About Section */}
            <View className="mb-6">
                <Text className="text-text font-bold text-xl mb-3">About</Text>
                <View className="bg-card border border-border rounded-2xl p-5">
                    <Text className="text-text leading-7">
                        {club.description || 'Welcome to our club! We are a community dedicated to learning and growing together.'}
                    </Text>
                </View>
            </View>

            {/* Leader Card */}
            {club.leader && (
                <View className="mb-6">
                    <Text className="text-text font-bold text-xl mb-3">Club Leader</Text>
                    <View className="bg-card border border-border rounded-3xl p-4 flex-row items-center">
                        <View className="w-14 h-14 bg-primary/10 rounded-2xl items-center justify-center mr-4">
                            <Crown size={24} color={COLORS.primary} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-text font-bold text-lg">{club.leader.fullName || 'Unknown'}</Text>
                            <Text className="text-text-secondary text-sm">{club.leader.email}</Text>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );

    const renderEvents = () => (
        <View className="px-5">
            {events.length > 0 ? (
                events.map((event) => {
                    const isPaid = event.pricingType !== 'FREE';
                    const isOnline = event.format === 'ONLINE';
                    return (
                        <TouchableOpacity
                            key={event.id}
                            className="mb-4 bg-card border border-border rounded-3xl overflow-hidden shadow-sm"
                            onPress={() => router.push(`/(student)/events/${event.id}`)}
                            activeOpacity={0.9}
                        >
                            <View className="h-40 relative">
                                <Image
                                    source={{ uri: club.logoUrl }}
                                    style={{ width: '100%', height: '100%' }}
                                    contentFit="cover"
                                />
                                <View className="absolute inset-0 bg-black/20" />
                                <View className="absolute top-3 right-3 bg-white/90 px-3 py-1 rounded-lg">
                                    <Text className={`text-xs font-bold ${isPaid ? 'text-primary' : 'text-success'}`}>
                                        {isPaid ? `${(event.price ?? 0).toLocaleString()}₫` : 'FREE'}
                                    </Text>
                                </View>
                            </View>
                            <View className="p-4">
                                <Text className="text-text font-bold text-lg mb-2">{event.title}</Text>
                                <View className="flex-row items-center text-text-secondary">
                                    <Calendar size={14} color={COLORS.textSecondary} />
                                    <Text className="text-xs ml-1 mr-3">
                                        {event.startTime ? new Date(event.startTime).toLocaleDateString() : 'TBD'}
                                    </Text>
                                    <MapPin size={14} color={COLORS.textSecondary} />
                                    <Text className="text-xs ml-1">
                                        {isOnline ? 'Online' : (event.location || 'TBD')}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })
            ) : (
                <Text className="text-text-secondary text-center mt-10">No upcoming events</Text>
            )}
        </View>
    );

    const renderMembers = () => (
        <View className="px-5">
            {loadingMembers ? (
                <ActivityIndicator size="small" color={COLORS.primary} className="mt-10" />
            ) : members.length > 0 ? (
                members.map((member, index) => {
                    const badge = getRoleBadge(member.role);
                    return (
                        <View key={member.id} className="flex-row items-center py-3 border-b border-border/50">
                            <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
                                <Text className="text-text font-bold">{member.user?.fullName?.charAt(0)}</Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-text font-semibold">{member.user?.fullName}</Text>
                                <Text className="text-text-secondary text-xs">{member.user?.email}</Text>
                            </View>
                            <View className={`px-2 py-1 rounded-md ${badge.bg}`}>
                                <Text className={`text-[10px] font-bold ${badge.text}`}>{member.role}</Text>
                            </View>
                        </View>
                    );
                })
            ) : (
                <Text className="text-text-secondary text-center mt-10">No members found</Text>
            )}
        </View>
    );

    return (
        <View className="flex-1 bg-background">
            {/* Hero Image - Keep fixed at top */}
            <View className="relative h-60">
                <Image
                    source={{ uri: club.logoUrl || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1000' }}
                    style={{ width: SCREEN_WIDTH, height: 280 }}
                    contentFit="cover"
                    transition={400}
                />
                <View className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Header Buttons */}
                <SafeAreaView className="absolute top-0 left-0 right-0 px-4 pt-2">
                    <View className="flex-row justify-between items-center">
                        <TouchableOpacity
                            className="w-12 h-12 bg-white/95 rounded-2xl items-center justify-center"
                            onPress={() => router.back()}
                            style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.15,
                                shadowRadius: 8,
                            }}
                        >
                            <ArrowLeft size={24} color={COLORS.text} />
                        </TouchableOpacity>
                        <View className="flex-row">
                            <TouchableOpacity
                                className="w-12 h-12 bg-white/95 rounded-2xl items-center justify-center mr-3"
                                onPress={() => setLiked(!liked)}
                                style={{
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.15,
                                    shadowRadius: 8,
                                }}
                            >
                                <Heart size={22} color={liked ? COLORS.error : COLORS.text} fill={liked ? COLORS.error : 'transparent'} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="w-12 h-12 bg-white/95 rounded-2xl items-center justify-center"
                                style={{
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.15,
                                    shadowRadius: 8,
                                }}
                            >
                                <Share2 size={22} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>

                {/* Member Badge */}
                {isUserMember && (
                    <View
                        className="absolute bottom-6 left-5 bg-success px-4 py-2 rounded-xl flex-row items-center"
                        style={{
                            shadowColor: COLORS.success,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.4,
                            shadowRadius: 8,
                        }}
                    >
                        <CheckCircle size={16} color="#FFF" />
                        <Text className="text-white font-bold ml-2">Member</Text>
                    </View>
                )}
            </View>

            {/* Content with Tabs */}
            <View className="flex-1 -mt-8 bg-background rounded-t-[32px] pt-8">
                <View className="px-5 mb-4">
                    <Text className="text-text text-3xl font-bold">{club.name}</Text>
                </View>

                {renderTabs()}

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: isUserMember ? 100 : 180 }}
                >
                    {activeTab === 'OVERVIEW' && renderOverview()}
                    {activeTab === 'EVENTS' && renderEvents()}
                    {activeTab === 'MEMBERS' && renderMembers()}
                </ScrollView>
            </View>

            {/* Bottom CTA - For non-members */}
            {!isUserMember && !checkingMembership && !checkingApplication && club && (
                <SafeAreaView
                    edges={['bottom']}
                    className="bg-card border-t border-border px-5 pt-5"
                    style={{ paddingBottom: 100 }}
                >
                    {hasPendingApplication ? (
                        // PENDING state
                        <View
                            className="bg-warning-soft border border-warning rounded-3xl p-5 items-center"
                            style={{
                                shadowColor: COLORS.warning,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.2,
                                shadowRadius: 8,
                            }}
                        >
                            <View className="flex-row items-center mb-3">
                                <Clock size={28} color={COLORS.warning} />
                                <Text className="text-warning font-bold text-xl ml-3">Application Pending</Text>
                            </View>
                            <Text className="text-text-secondary text-center mb-4">
                                Your application is being reviewed. We'll notify you once there's an update.
                            </Text>
                            <TouchableOpacity
                                className="bg-warning/20 px-6 py-3 rounded-xl"
                                onPress={() => router.push('/(student)/clubs/my-applications')}
                            >
                                <Text className="text-warning font-bold">View My Applications</Text>
                            </TouchableOpacity>
                        </View>
                    ) : applicationStatus === 'APPROVED' && fee > 0 ? (
                        // APPROVED but need to pay membership fee
                        <View
                            className="bg-success-soft border border-success rounded-3xl p-5 items-center"
                            style={{
                                shadowColor: COLORS.success,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.2,
                                shadowRadius: 8,
                            }}
                        >
                            <View className="flex-row items-center mb-3">
                                <CheckCircle size={28} color={COLORS.success} />
                                <Text className="text-success font-bold text-xl ml-3">Application Approved!</Text>
                            </View>
                            <Text className="text-text-secondary text-center mb-4">
                                Complete your membership by paying the fee below.
                            </Text>
                            <TouchableOpacity
                                className="w-full bg-success py-4 rounded-2xl items-center flex-row justify-center"
                                style={{
                                    shadowColor: COLORS.success,
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 8,
                                }}
                                onPress={() => router.push({
                                    pathname: '/(student)/clubs/membership-payment' as any,
                                    params: { clubId: club.id, clubName: club.name, amount: String(fee) }
                                })}
                            >
                                <Text className="text-white font-bold text-lg">Pay Now - {fee.toLocaleString()}₫</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        // No application or can apply
                        <>
                            {fee > 0 && (
                                <View className="flex-row justify-between items-center mb-4">
                                    <Text className="text-text-secondary text-base">Membership Fee</Text>
                                    <Text className="text-primary text-2xl font-bold">{fee.toLocaleString()}₫</Text>
                                </View>
                            )}
                            <TouchableOpacity
                                className="w-full bg-primary py-5 rounded-2xl items-center flex-row justify-center"
                                style={{
                                    shadowColor: COLORS.primary,
                                    shadowOffset: { width: 0, height: 6 },
                                    shadowOpacity: 0.4,
                                    shadowRadius: 12,
                                }}
                                onPress={() => router.push({
                                    pathname: '/(student)/clubs/apply' as any,
                                    params: { clubId: club.id, clubName: club.name, fee: String(fee) }
                                })}
                            >
                                <Text className="text-white font-bold text-lg">
                                    {fee === 0 ? 'Join Club - Free' : 'Apply to Join'}
                                </Text>
                                <ChevronRight size={20} color="#FFF" className="ml-2" />
                            </TouchableOpacity>
                        </>
                    )}
                </SafeAreaView>
            )}
        </View>
    );
}
