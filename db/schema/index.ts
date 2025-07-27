import { account, session, user, verification } from './auth';
import { workingHours } from './working-hours';
import { exchangeData } from './exchange';
import { preferences } from './preferences';
import { userEmails } from './user-emails';
import { allowedList } from './allowed-list';
import { userRelations, accountRelations, sessionRelations } from './auth-relations';

export const schema = {
    user: user,
    account: account,
    session: session,
    verification: verification,
    workingHours: workingHours,
    exchangeData: exchangeData,
    preferences: preferences,
    userEmails: userEmails,
    allowedList: allowedList,
};

export const relations = {
    userRelations,
    accountRelations,
    sessionRelations,
};
