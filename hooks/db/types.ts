import { User, Account, Session, GenericEndpointContext } from 'better-auth';

/**
 * User hook function types - using Better Auth's GenericEndpointContext
 */
export type UserBeforeCreateHook = (user: User, context?: GenericEndpointContext) => Promise<void>;
export type UserAfterCreateHook = (user: User, context?: GenericEndpointContext) => Promise<void>;

/**
 * Account hook function types - using Better Auth's GenericEndpointContext
 */
export type AccountBeforeCreateHook = (
    account: Account,
    context?: GenericEndpointContext,
) => Promise<void>;
export type AccountAfterCreateHook = (
    account: Account,
    context?: GenericEndpointContext,
) => Promise<void>;

/**
 * Session hook function types - using Better Auth's GenericEndpointContext
 */
export type SessionBeforeCreateHook = (
    session: Session,
    context?: GenericEndpointContext,
) => Promise<void>;
export type SessionAfterCreateHook = (
    session: Session,
    context?: GenericEndpointContext,
) => Promise<void>;

/**
 * Database hooks configuration interface
 */
export interface DatabaseHooks {
    user: {
        create: {
            before: UserBeforeCreateHook;
            after: UserAfterCreateHook;
        };
    };
    account: {
        create: {
            before: AccountBeforeCreateHook;
            after: AccountAfterCreateHook;
        };
    };
    session: {
        create: {
            before: SessionBeforeCreateHook;
            after: SessionAfterCreateHook;
        };
    };
}
