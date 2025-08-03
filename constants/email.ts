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

https://www.cruso.app/signup

Best,
Nick
`;

export const ONBOARDING_EMAIL_REPLY_TEMPLATE = `
Hey,

I noticed this email isn't in our system yet, so I'm guessing you haven't had a chance to check out Cruso properly.

No worries at all - happens all the time! I'm Nick, the founder, and I'd love to get you set up so you can see what we're all about.

Just hop over here when you get a sec

https://www.cruso.app/signup

Can't wait to see you onboarded!

Cheers,
Nick
`;

/**
 * ===============================
 * Welcome email for new users
 * ===============================
 */
export const WELCOME_EMAIL_SUBJECT = "And you're in - Welcome to Cruso";

export const WELCOME_EMAIL_BODY = `Hi,

Welcome to Cruso! I'm your new executive assistant, and I'm here to help manage your calendar and scheduling.

I can handle meeting scheduling, rescheduling, finding available slots, and keeping your calendar organized - all with minimal back-and-forth.

Here's a quick rundown of some of the things you can ask me to do:

- Schedule 30 mins tomorrow to prep for the board meeting
- Find us a time for a sync with Sarah and Mike next week
- What's on my calendar this afternoon?
- Reschedule the quarterly review meeting with the board
- Clear my calendar this afternoon
- Change my working hours to 11 AM - 2 PM, Monday to Friday

I'm a work in progress, so please bear with me as I learn more about you and your preferences. You could also help me get better by simply replying to this email or by changing your preference document in the dashboard.

To get started, simply forward me any email with scheduling context, and I'll take care of the rest.

Cheers,
Cruso`;

// export const WELCOME_EMAIL_SIGNATURE = 'Cheers, \nCruso';

/**
 * ===============================
 * Waitlist email for users on waitlist
 * ===============================
 */
export const WAITLIST_EMAIL_SUBJECT =
    "Good things come to those who wait ... actually, let's speed this up";

export const WAITLIST_EMAIL_BODY = `Hey there,

Thanks for signing up! We're thrilled to have you on board.

We're gradually rolling out access for new teams, and will reach out with onboarding details as soon as your spot opens up.

If waiting doesn't work for you (we understand!), let us know at https://cal.com/nayann/cruso. We occasionally fast-track access for individuals who are ready to dive straight in.

Cruso is an AI executive assistant designed to handle calendar and scheduling needs with minimal back-and-forth. It can schedule meetings, find available slots, reschedule appointments, and keep calendars organized.

Stay tuned,
Cruso`;

// export const WAITLIST_EMAIL_SIGNATURE = 'Cheers, \nCruso';

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
