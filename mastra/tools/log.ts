// Helper function to log tool execution
export const logToolExecution = (toolName: string, input: any, output: any) => {
    console.log('='.repeat(50));
    console.log(`[${toolName}] Input:`, JSON.stringify(input, null, 2));
    console.log(`[${toolName}] Output:`, output);
    console.log('='.repeat(50));
};
