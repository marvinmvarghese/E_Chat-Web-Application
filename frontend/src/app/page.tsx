import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, ShieldCheck, Zap, Globe, MessageCircle, Users, Bell } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden">

      {/* ─── Navbar ─── */}
      <header className="px-6 h-16 flex items-center border-b border-border/40 backdrop-blur-md sticky top-0 z-50 bg-background/80">
        <div className="flex items-center gap-2.5 font-bold text-xl mr-auto">
          <div className="h-9 w-9 rounded-xl bg-tg-gradient flex items-center justify-center text-white shadow-tg">
            <MessageCircle className="h-5 w-5" />
          </div>
          <span className="text-tg-gradient">E-Chat</span>
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
          <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
          <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-foreground transition-colors">About</Link>
        </nav>
        <div className="ml-6 flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Sign In
          </Link>
          <Link href="/signup">
            <Button size="sm" className="bg-tg-gradient hover:opacity-90 text-white border-0 shadow-tg btn-press rounded-xl px-5">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <main className="flex-1">
        <section className="relative flex flex-col items-center justify-center text-center px-4 py-28 overflow-hidden">

          {/* Background blobs */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-primary/8 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-1/4 w-[500px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
          </div>

          {/* Floating chat bubbles decoration */}
          <div className="absolute top-20 left-[8%] hidden lg:block animate-slide-in-left">
            <div className="bubble-sent px-4 py-2 text-sm text-white shadow-tg max-w-[180px]">
              Hey! How are you? 👋
            </div>
          </div>
          <div className="absolute top-36 left-[6%] hidden lg:block animate-slide-in-left" style={{animationDelay:'0.1s'}}>
            <div className="bubble-received px-4 py-2 text-sm max-w-[160px]">
              I&apos;m great, thanks! 😊
            </div>
          </div>
          <div className="absolute top-20 right-[8%] hidden lg:block animate-slide-in-right">
            <div className="bubble-sent px-4 py-2 text-sm text-white shadow-tg max-w-[200px]">
              Just sent the files! 📎
            </div>
          </div>
          <div className="absolute top-38 right-[6%] hidden lg:block animate-slide-in-right" style={{animationDelay:'0.15s'}}>
            <div className="bubble-received px-4 py-2 text-sm max-w-[160px]">
              Got it! Perfect ✅
            </div>
          </div>

          {/* Badge */}
          <div className="relative z-10 mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/25 bg-primary/8 text-sm font-medium text-primary animate-scale-in backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            Now with Voice & File Sharing · v2.0
          </div>

          {/* Headline */}
          <h1 className="relative z-10 text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.08] max-w-3xl animate-slide-in-left">
            <span className="block text-foreground">Chat faster.</span>
            <span className="block text-tg-gradient">Stay private.</span>
          </h1>

          <p className="relative z-10 mt-6 text-xl text-muted-foreground max-w-xl leading-relaxed animate-fade-in">
            Real-time messaging with end-to-end encryption, voice messages,
            file sharing, and group chats — all in one beautiful app.
          </p>

          {/* CTAs */}
          <div className="relative z-10 mt-10 flex flex-col sm:flex-row items-center gap-4 animate-slide-up">
            <Link href="/signup">
              <Button size="lg" className="h-13 px-8 text-base bg-tg-gradient text-white border-0 shadow-tg-lg hover:opacity-90 hover-lift btn-press rounded-2xl gap-2">
                Start Chatting Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="h-13 px-8 text-base rounded-2xl border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Social proof */}
          <p className="relative z-10 mt-6 text-sm text-muted-foreground animate-fade-in">
            🔒 End-to-end encrypted · No ads · No data selling
          </p>
        </section>

        {/* ─── Features ─── */}
        <section id="features" className="px-6 py-20 max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to <span className="text-tg-gradient">connect</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Built for speed, designed for privacy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: ShieldCheck,
                title: "Military-Grade Encryption",
                desc: "Every message is secured end-to-end. Nobody—not even us—can read your conversations.",
                color: "from-blue-500 to-cyan-400",
              },
              {
                icon: Zap,
                title: "Instant Delivery",
                desc: "Messages arrive in milliseconds. Real-time presence, typing indicators, and read receipts.",
                color: "from-violet-500 to-blue-500",
              },
              {
                icon: Globe,
                title: "Works Everywhere",
                desc: "Sync seamlessly across all your devices. Desktop, tablet, or mobile—always in sync.",
                color: "from-cyan-500 to-teal-400",
              },
              {
                icon: MessageCircle,
                title: "Voice Messages",
                desc: "Record and send voice notes instantly. Express yourself beyond text.",
                color: "from-blue-600 to-indigo-500",
              },
              {
                icon: Users,
                title: "Group Chats",
                desc: "Create groups for teams, friends, or projects. Stay organized and connected.",
                color: "from-indigo-500 to-purple-500",
              },
              {
                icon: Bell,
                title: "Smart Notifications",
                desc: "Get notified about the messages that matter. Stay focused, not distracted.",
                color: "from-sky-500 to-blue-600",
              },
            ].map((feat, i) => (
              <div
                key={i}
                className="group p-7 rounded-2xl bg-card border border-border/50 hover:border-primary/40 hover-lift transition-all cursor-default"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center mb-5 shadow-tg group-hover:scale-110 transition-transform`}>
                  <feat.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feat.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── CTA Banner ─── */}
        <section className="px-6 pb-24">
          <div className="max-w-4xl mx-auto rounded-3xl bg-tg-gradient p-px shadow-tg-lg">
            <div className="rounded-3xl bg-gradient-to-br from-primary/90 to-blue-700 px-10 py-14 text-center text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to get started?</h2>
              <p className="text-white/80 text-lg mb-8 max-w-lg mx-auto">
                Join thousands of people who trust E-Chat for secure, fast communication.
              </p>
              <Link href="/signup">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold px-8 rounded-2xl h-13 btn-press shadow-lg">
                  Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border/40 py-8 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="h-6 w-6 rounded-lg bg-tg-gradient flex items-center justify-center">
            <MessageCircle className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-semibold text-foreground">E-Chat</span>
        </div>
        <p>© 2026 E-Chat. Secure. Private. Fast.</p>
      </footer>

    </div>
  )
}
