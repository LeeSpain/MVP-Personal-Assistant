export async function GET() {
    return new Response(
        JSON.stringify({
            OPENROUTER_API_KEY_PRESENT: !!process.env.OPENROUTER_API_KEY,
            OPENROUTER_API_KEY_VALUE: process.env.OPENROUTER_API_KEY || null
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
}
