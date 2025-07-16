import { storage } from '../storage/pg';

/**
 * WorkingMemoryResult - It is used to store the working memory of a resource.
 */
export interface WorkingMemoryResult {
    /**
     * The working memory of the resource.
     */
    working_memory: string | null;
}

/**
 * Get the working memory of a resource
 * @param resourceId - The id of the resource
 * @returns The working memory of the resource
 */
export const getWorkingMemory = async (resourceId: string): Promise<WorkingMemoryResult | null> => {
    const db = storage.db;
    const query = `SELECT "workingMemory" as working_memory FROM mastra.mastra_resources WHERE id = $1`;
    return await db.oneOrNone<WorkingMemoryResult>(query, [resourceId]);
};
