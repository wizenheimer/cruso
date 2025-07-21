import { account, session, user, verification } from './auth';
import { availability } from './availability';
import { exchangeData } from './exchange';
import { preferences } from './preferences';
import { userEmails } from './user-emails';
import { userRelations, accountRelations, sessionRelations } from './auth-relations';

export const schema = {
    user: user,
    account: account,
    session: session,
    verification: verification,
    availability: availability,
    exchangeData: exchangeData,
    preferences: preferences,
    userEmails: userEmails,
};

export const relations = {
    userRelations,
    accountRelations,
    sessionRelations,
};
