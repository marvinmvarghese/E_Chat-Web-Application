import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(req: NextRequest) {
    try {
        const { messages } = await req.json()

        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) {
            // Fallback demo responses when no API key is set
            const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || ""
            let reply = "I'm E-Chat AI 🤖 — I need an OpenAI API key to be fully powered. Set `OPENAI_API_KEY` in your Vercel environment variables to unlock full AI capabilities!"
            if (lastMsg.includes("hello") || lastMsg.includes("hi")) reply = "Hey there! 👋 I'm E-Chat AI. Set up your OpenAI API key to chat with me fully!"
            if (lastMsg.includes("help")) reply = "I can help you with information, writing, coding, and more — once you set the `OPENAI_API_KEY` in Vercel! 🚀"
            return NextResponse.json({ reply })
        }

        const systemPrompt = `You are E-Chat AI, a helpful, friendly, and intelligent assistant built into E-Chat — a premium secure messaging app. 
You help users with questions, writing, coding, brainstorming, and more.
Keep responses concise and friendly. Use markdown when helpful (code blocks, bullet points etc).
You are powered by GPT-4o.`

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "system", content: systemPrompt }, ...messages],
                max_tokens: 1024,
                temperature: 0.7,
            })
        })

        if (!response.ok) {
            const err = await response.json()
            return NextResponse.json({ reply: `AI error: ${err.error?.message || "Unknown error"}` }, { status: 500 })
        }

        const data = await response.json()
        const reply = data.choices[0]?.message?.content || "Sorry, I couldn't generate a response."
        return NextResponse.json({ reply })

    } catch (e) {
        console.error("AI chat error:", e)
        return NextResponse.json({ reply: "Something went wrong. Please try again." }, { status: 500 })
    }
}
