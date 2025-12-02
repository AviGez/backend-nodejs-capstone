const BADGES = [
    {
        id: 'top-giver-bronze',
        label: 'Top Giver · Bronze',
        description: 'Sold at least 5 items',
        type: 'itemsSold',
        threshold: 5,
    },
    {
        id: 'top-giver-silver',
        label: 'Top Giver · Silver',
        description: 'Sold at least 20 items',
        type: 'itemsSold',
        threshold: 20,
    },
    {
        id: 'top-giver-gold',
        label: 'Top Giver · Gold',
        description: 'Sold at least 50 items',
        type: 'itemsSold',
        threshold: 50,
    },
    {
        id: 'eco-hero',
        label: 'Eco Hero',
        description: 'Listed at least 10 free items',
        type: 'freeItemsPosted',
        threshold: 10,
    },
    {
        id: 'lightning-responder',
        label: 'Lightning Responder',
        description: 'Average approval response time under 12 hours',
        type: 'avgApprovalHours',
        threshold: 12,
        comparison: 'lt',
    },
];

const SELLER_LEVELS = [
    { id: 'rookie', label: 'Rookie Seller', minScore: 0 },
    { id: 'bronze', label: 'Bronze Seller', minScore: 5 },
    { id: 'silver', label: 'Silver Seller', minScore: 20 },
    { id: 'gold', label: 'Gold Seller', minScore: 50 },
    { id: 'platinum', label: 'Platinum Seller', minScore: 100 },
];

module.exports = {
    BADGES,
    SELLER_LEVELS,
};

