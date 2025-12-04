export const EVENTS = [
    {
        id: '1',
        title: 'Welcome New Students 2025',
        date: '2025-09-15T18:00:00',
        location: 'Main Hall A',
        price: 0,
        image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=80',
        description: 'The biggest event of the year to welcome our new freshmen. Music, games, and food!',
        isPublic: true,
        type: 'PUBLIC',
        clubId: null,
    },
    {
        id: '2',
        title: 'Tech Workshop: AI in 2025',
        date: '2025-10-05T09:00:00',
        location: 'Lab 301',
        price: 50000,
        image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80',
        description: 'Learn about the latest trends in AI and how to apply them in your projects.',
        isPublic: true,
        type: 'PUBLIC',
        clubId: 'c1',
    },
    {
        id: '3',
        title: 'Internal Team Building',
        date: '2025-11-20T08:00:00',
        location: 'City Park',
        price: 100000,
        image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&q=80',
        description: 'A day for our club members to bond and have fun together.',
        isPublic: false,
        type: 'INTERNAL',
        clubId: 'c1',
    },
];

export const TICKETS = [
    {
        id: 't1',
        eventId: '1',
        eventName: 'Welcome New Students 2025',
        studentName: 'Nguyen Van A',
        status: 'VALID',
        qrCode: 'QR_EVENT_1_STUDENT_A',
    },
];

export const CURRENT_USER = {
    id: 'u1',
    name: 'Nguyen Van Student',
    studentId: 'SE123456',
    memberships: ['c1'], // Member of AI Club
};

export const CLUBS = [
    {
        id: 'c1',
        name: 'FPT University AI Club',
        category: 'Technology',
        image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80',
        description: 'A community for AI enthusiasts to learn, build, and share knowledge about Artificial Intelligence and Machine Learning.',
        members: 120,
        established: '2020',
        type: 'FREE',
        membershipFee: 0,
    },
    {
        id: 'c2',
        name: 'F-Guitar Club',
        category: 'Music',
        image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80',
        description: 'Join us to jam, learn guitar, and perform at university events. Open to all skill levels!',
        members: 85,
        established: '2018',
        type: 'PAID',
        membershipFee: 50000,
    },
    {
        id: 'c3',
        name: 'Business & Startup Club',
        category: 'Business',
        image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80',
        description: 'Connect with future entrepreneurs, learn about startups, and participate in business case competitions.',
        members: 150,
        established: '2019',
        type: 'FREE',
        membershipFee: 0,
    },
];

export const REQUESTS = [
    {
        id: 'r1',
        title: 'Buy Water for Workshop',
        amount: 500000,
        status: 'PENDING_REVIEW',
        date: '2025-10-01',
        evidence: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80',
    },
    {
        id: 'r2',
        title: 'Printing Banners',
        amount: 1200000,
        status: 'COMPLETED',
        date: '2025-09-10',
        evidence: 'https://images.unsplash.com/photo-1562564055-71e051d33c19?w=800&q=80',
    },
];
