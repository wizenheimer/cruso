/**
 * ===============================
 * EMAIL TEMPLATES
 * ===============================
 */

/**
 * ===============================
 * Onboarding email
 * ===============================
 */
export const ONBOARDING_EMAIL_SUBJECTS = [
    "Welcome to Cruso - Let's get you started",
    "Let's make it official - shall we begin?",
    "Let's get you up and running with Cruso",
    "Alright baby steps - let's get you set up",
    "It's time to make Cruso yours",
    "Can't wait for you to see what Cruso can do",
    'Just a few clicks away from getting started',
    "Knock, knock… onboarding's at the door",
    'Come on in - we saved you the best seat!',
    "Let's make it official - ready when you are",
    'New beginnings look good on you',
    "We made something cool for you - let's get you set up",
    "Ready to make magic together? - let's get you set up",
    'Psst… your Cruso journey is waiting',
];

export const getRandomOnboardingSubject = (): string => {
    const randomIndex = Math.floor(Math.random() * ONBOARDING_EMAIL_SUBJECTS.length);
    return ONBOARDING_EMAIL_SUBJECTS[randomIndex];
};

export const ONBOARDING_EMAIL_TEMPLATE = `
Hi,

Welcome to Cruso! We're thrilled to have you on board.

This is Nick, founder of Cruso. Quick auth, and you'd be all set.

https://crusolabs.com/signup

As you explore the platform, please do not hesitate to reach out to me directly. I would be delighted to hear from you at nick@crusolabs.com.

Best,
Nick
`;

export const ONBOARDING_EMAIL_REPLY_TEMPLATE = `
Hey,

I noticed this email isn't in our system yet, so I'm guessing you haven't had a chance to check out Cruso properly.

No worries at all - happens all the time! I'm Nick, the founder, and I'd love to get you set up so you can see what we're all about.

Just hop over here when you get a sec

https://crusolabs.com/signup

Can't wait to see you onboarded!

Cheers,
Nick
`;

/**
 * ===============================
 * Offboarding email for users
 * ===============================
 */
export const USER_REPLYING_TO_OLDER_EMAIL_TEMPLATE = `
Hi,

Seems you're trying to reply to an older email in the thread. Instead, consider replying to the latest email in the thread, or creating a new thread altogether.

`;

/**
 * ===============================
 * Offboarding email for non-users
 * ===============================
 */
export const NON_USER_REPLYING_TO_OLDER_EMAIL_TEMPLATE = `
Hi,

Seems you're trying to reply to an older email in the thread. Instead, consider replying to the latest email in the thread, or creating a new thread altogether.

`;

/**
 * ===============================
 * EMAIL TEMPLATES
 * ===============================
 */
