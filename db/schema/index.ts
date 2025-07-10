import { account, session, user, verification } from './auth';
import { availability } from './availability';
import { exchangeOwners } from './exchange-owners';
import { inboxData } from './inbox';
import { preferences } from './preferences';
import { userEmails } from './user-emails';
import { userRelations, accountRelations, sessionRelations } from './auth-relations';

export const schema = {
    user: user,
    account: account,
    session: session,
    verification: verification,
    availability: availability,
    exchangeOwners: exchangeOwners,
    inboxData: inboxData,
    preferences: preferences,
    userEmails: userEmails,
};

export const relations = {
    userRelations,
    accountRelations,
    sessionRelations,
};
