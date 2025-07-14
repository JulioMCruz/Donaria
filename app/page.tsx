import Link from "next/link"
import { HandHeart, ShieldCheck, Zap, SearchCheck, Share2, Wallet, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DonariaLandingPage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-gray-50 dark:bg-gray-950">

      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-900">
          <div className="container px-4 md:px-6 text-center">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-gray-900 dark:text-white">
                Connecting Verified Needs with Direct Aid.
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                A bridge of trust connecting affected communities with verified help. We use technology to ensure every
                contribution reaches those who need it most, transparently and without complications.
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-4 min-[400px]:flex-row justify-center">
              <Link href="/login">
                <Button size="lg" className="bg-teal-500 hover:bg-teal-600 text-white">
                  Donate Now
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  Report a Need
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-900">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-teal-100 px-3 py-1 text-sm text-teal-800 dark:bg-teal-900/50 dark:text-teal-300">
                  Our Solution
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">A New Standard in Aid</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  We've built an ecosystem that combines verified identity with total transparency to directly connect
                  those affected by crises with donors, eliminating intermediaries and guaranteeing real impact.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 mt-12">
              <div className="grid gap-1 text-center">
                <div className="flex justify-center items-center mb-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-md">
                    <Smartphone className="h-8 w-8 text-teal-500" />
                  </div>
                </div>
                <h3 className="text-lg font-bold">Immediate Registration</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Log in with social accounts on any connection (even 2G). An automatic digital wallet is created
                  instantly.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <div className="flex justify-center items-center mb-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-md">
                    <SearchCheck className="h-8 w-8 text-teal-500" />
                  </div>
                </div>
                <h3 className="text-lg font-bold">AI-Powered Verification</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Our AI validates the authenticity of reports, needs, and evidence, preventing fraud and
                  misinformation.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <div className="flex justify-center items-center mb-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-md">
                    <Share2 className="h-8 w-8 text-teal-500" />
                  </div>
                </div>
                <h3 className="text-lg font-bold">Total Transparency</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Track donations from your wallet to the final beneficiary in real-time on the Stellar blockchain.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <div className="flex justify-center items-center mb-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-md">
                    <ShieldCheck className="h-8 w-8 text-teal-500" />
                  </div>
                </div>
                <h3 className="text-lg font-bold">Verifiable Credentials</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Build a self-sovereign digital identity and reputation that's portable across different crises.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <div className="flex justify-center items-center mb-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-md">
                    <Zap className="h-8 w-8 text-teal-500" />
                  </div>
                </div>
                <h3 className="text-lg font-bold">Automated Distribution</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Smart contracts automate aid distribution based on verified urgency, ensuring help arrives in critical
                  hours.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <div className="flex justify-center items-center mb-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-md">
                    <Wallet className="h-8 w-8 text-teal-500" />
                  </div>
                </div>
                <h3 className="text-lg font-bold">Direct Micropayments</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Funds go directly to the affected individuals without inefficient intermediaries or bank accounts.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="impact" className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-900">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-teal-100 px-3 py-1 text-sm text-teal-800 dark:bg-teal-900/50 dark:text-teal-300">
                  Real-Time Impact
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  See Your Donation at Work
                </h2>
                <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed dark:text-gray-400">
                  Our public dashboard provides a transparent, live view of needs and donations. Anyone can audit the
                  flow of funds and see the real-world impact of their contribution.
                </p>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <h4 className="text-2xl font-bold">$1.2M+</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Funds Distributed</p>
                  </div>
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <h4 className="text-2xl font-bold">15,000+</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Families Helped</p>
                  </div>
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <h4 className="text-2xl font-bold">8,500+</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Verified Reports</p>
                  </div>
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <h4 className="text-2xl font-bold">24/7</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Live Operations</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <img
                  src="/south-america-map-pins.png"
                  width="550"
                  height="400"
                  alt="Impact Map"
                  className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 border-t bg-gray-100 dark:bg-gray-900">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Join Donaria Today</h2>
              <p className="mx-auto max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Be the bridge of trust. Whether you are a donor, an NGO, or a community in need, you can be part of a
                more effective and transparent future for humanitarian aid.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
              <div className="flex flex-col gap-4 min-[400px]:flex-row justify-center">
                <Link href="/login">
                  <Button size="lg" className="bg-teal-500 hover:bg-teal-600 text-white">
                    Donate Now
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline">
                    Get Involved
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white dark:bg-gray-900">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          &copy; {new Date().getFullYear()} Donaria. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}
