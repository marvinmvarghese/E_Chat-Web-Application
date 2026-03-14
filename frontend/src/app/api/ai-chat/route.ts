import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(req: NextRequest) {
    try {
        const { messages } = await req.json()

        const groqKey = process.env.GROQ_API_KEY
        const openaiKey = process.env.OPENAI_API_KEY

        const systemPrompt = `You are E-Chat AI, a helpful, friendly, and intelligent assistant built into E-Chat — a premium secure messaging app. 
Help users with questions, writing, coding, brainstorming, and more. Be concise and friendly. Use markdown when helpful.`

        // ── Try Groq first (free, fast) ──
        if (groqKey) {
            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${groqKey}`
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [{ role: "system", content: systemPrompt }, ...messages],
                    max_tokens: 1024,
                    temperature: 0.7,
                })
            })
            if (res.ok) {
                const data = await res.json()
                return NextResponse.json({ reply: data.choices[0]?.message?.content || "No response." })
            }
            const err = await res.json().catch(() => ({}))
            return NextResponse.json({ reply: `AI error: ${(err as { error?: { message?: string } }).error?.message || res.statusText}` })
        }

        // ── Fallback to OpenAI ──
        if (openaiKey) {
            const res = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${openaiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [{ role: "system", content: systemPrompt }, ...messages],
                    max_tokens: 1024,
                    temperature: 0.7,
                })
            })
            if (res.ok) {
                const data = await res.json()
                return NextResponse.json({ reply: data.choices[0]?.message?.content || "No response." })
            }
            const err = await res.json().catch(() => ({}))
            return NextResponse.json({ reply: `AI error: ${(err as { error?: { message?: string } }).error?.message || res.statusText}` })
        }

        // ── No key set ──
        return NextResponse.json({
            reply: "🤖 E-Chat AI needs an API key to work!\n\n**Free option (recommended):**\n1. Go to [console.groq.com](https://console.groq.com) → create a free account → generate an API key\n2. Add `GROQ_API_KEY` to Vercel → Settings → Environment Variables\n3. Redeploy — done!\n\n**Paid option:** Set `OPENAI_API_KEY` with an active billing account."
        })

    } catch (e) {
        console.error("AI chat error:", e)
        return NextResponse.json({ reply: "Something went wrong. Please try again." }, { status: 500 })
    }
}
