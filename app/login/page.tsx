import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Chrome, Twitter, Instagram, HandHeart } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-6">
          <HandHeart className="h-8 w-8 text-teal-500" />
          <span className="font-bold text-2xl text-gray-800 dark:text-white">DONARIA</span>
        </Link>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Log In</CardTitle>
            <CardDescription>Choose your preferred method to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <Button variant="outline">
                <Chrome className="mr-2 h-4 w-4" /> Continue with Google
              </Button>
              <Button variant="outline">
                <Twitter className="mr-2 h-4 w-4" /> Continue with X
              </Button>
              <Button variant="outline">
                <Instagram className="mr-2 h-4 w-4" /> Continue with Instagram
              </Button>
            </div>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground dark:bg-gray-900">Or continue with</span>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="name@example.com" required />
              </div>
              <Link href="/role-selection" className="w-full">
                <Button className="w-full bg-teal-500 hover:bg-teal-600 text-white">Continue with Email</Button>
              </Link>
            </div>
            <div className="mt-6 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="#" className="underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
