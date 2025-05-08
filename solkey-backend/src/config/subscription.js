const plans = {
    basic: {
        id: 'basic',
        name: 'Basic Plan',
        amount: 0.1,
        features: ['Up to 3 projects', 'Basic encryption', 'Email support']
    },
    pro: {
        id: 'pro',
        name: 'Pro Plan',
        amount: 0.5,
        features: ['Unlimited projects', 'Advanced encryption', 'Priority support', 'Team collaboration']
    },
    enterprise: {
        id: 'enterprise',
        name: 'Enterprise Plan',
        amount: 1.0,
        features: ['Custom solutions', 'Dedicated support', 'Advanced security', 'Custom integrations']
    }
};

function getPlanAmount(planId) {
    const plan = plans[planId];
    if (!plan) throw new Error('Invalid plan ID');
    return plan.amount;
}

function getPlanDetails(planId) {
    const plan = plans[planId];
    if (!plan) throw new Error('Invalid plan ID');
    return plan;
}

module.exports = { plans, getPlanAmount, getPlanDetails };