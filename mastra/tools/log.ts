// mastra/tools/log.ts

/**
 * Log tool execution
 * @param toolName - The name of the tool
 * @param input - The input to the tool
 * @param output - The output from the tool
 */
export const logToolExecution = (toolName: string, input: any, output: any) => {
    console.log('='.repeat(50));
    console.log(`[${toolName}] Input:`, JSON.stringify(input, null, 2));
    console.log(`[${toolName}] Output:`, output);
    console.log('='.repeat(50));
};
