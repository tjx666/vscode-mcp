/**
 * Sleep command implementation
 */
export async function sleepCommand(duration: number): Promise<void> {
    await new Promise<void>(resolve => {
        setTimeout(resolve, duration * 1000);
    });
}