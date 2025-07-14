'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { HandHeart, Menu, User, LogOut, Wallet } from "lucide-react"
import { useAuth } from '@/contexts/AuthContext'
import { useWallet } from '@/contexts/WalletContext'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"

export function GlobalHeader() {
  const pathname = usePathname()
  const { user, signOut, loading: authLoading } = useAuth()
  const { wallet, account, disconnectWallet } = useWallet()

  const handleLogout = async () => {
    await signOut()
    disconnectWallet()
    window.location.href = '/'
  }

  // Hide header on login and auth pages
  const hideOnPaths = ['/login', '/auth']
  if (hideOnPaths.some(path => pathname?.startsWith(path))) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-900/95 dark:supports-[backdrop-filter]:bg-gray-900/60">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <HandHeart className="h-6 w-6 text-teal-500" />
          <span className="font-bold text-xl text-gray-800 dark:text-white">DONARIA</span>
        </Link>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/#features"
            className="text-sm font-medium hover:text-teal-600 transition-colors"
          >
            How it Works
          </Link>
          <Link
            href="/#impact"
            className="text-sm font-medium hover:text-teal-600 transition-colors"
          >
            Impact
          </Link>
          {user && (
            <>
              <Link
                href="/dashboard/donor"
                className="text-sm font-medium hover:text-teal-600 transition-colors"
              >
                Browse Needs
              </Link>
              <Link
                href="/dashboard/beneficiary"
                className="text-sm font-medium hover:text-teal-600 transition-colors"
              >
                My Reports
              </Link>
            </>
          )}
        </nav>

        {/* Auth Section */}
        <div className="flex items-center gap-4">
          {authLoading ? (
            <div className="h-8 w-8 animate-pulse bg-gray-200 rounded-full" />
          ) : user ? (
            <div className="flex items-center gap-3">
              {/* Wallet Status */}
              {account && (
                <div className="hidden sm:flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-teal-500" />
                  <Badge variant="outline" className="text-xs">
                    {account.balances?.[0]?.balance ? 
                      `${parseFloat(account.balances[0].balance).toFixed(2)} XLM` : 
                      'Loading...'
                    }
                  </Badge>
                </div>
              )}

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} alt={user.name || user.email || 'User'} />
                      <AvatarFallback className="text-xs">
                        {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.name || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email || 'No email'}
                      </p>
                      {wallet.publicKey && (
                        <p className="text-xs leading-none text-muted-foreground">
                          Wallet: {wallet.publicKey.slice(0, 8)}...{wallet.publicKey.slice(-4)}
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/wallet" className="cursor-pointer">
                      <Wallet className="mr-2 h-4 w-4" />
                      <span>Wallet</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/donor" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Browse Needs</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/beneficiary" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>My Reports</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/role-selection" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Switch Role</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Log In
                </Button>
              </Link>
              <Link href="/login">
                <Button size="sm" className="bg-teal-500 hover:bg-teal-600">
                  Get Started
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex items-center gap-2 pb-4 border-b">
                <HandHeart className="h-6 w-6 text-teal-500" />
                <span className="font-bold text-xl">DONARIA</span>
              </div>
              <div className="flex flex-col space-y-4 mt-4">
                <Link
                  href="/#features"
                  className="text-sm font-medium hover:text-teal-600 transition-colors"
                >
                  How it Works
                </Link>
                <Link
                  href="/#impact"
                  className="text-sm font-medium hover:text-teal-600 transition-colors"
                >
                  Impact
                </Link>
                {user ? (
                  <>
                    <div className="border-t pt-4">
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} alt={user.name || user.email || 'User'} />
                          <AvatarFallback className="text-xs">
                            {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.name || 'User'}</p>
                          <p className="text-xs text-muted-foreground">{user.email || 'No email'}</p>
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/wallet"
                      className="text-sm font-medium hover:text-teal-600 transition-colors"
                    >
                      Wallet
                    </Link>
                    <Link
                      href="/dashboard/donor"
                      className="text-sm font-medium hover:text-teal-600 transition-colors"
                    >
                      Browse Needs
                    </Link>
                    <Link
                      href="/dashboard/beneficiary"
                      className="text-sm font-medium hover:text-teal-600 transition-colors"
                    >
                      My Reports
                    </Link>
                    <Link
                      href="/role-selection"
                      className="text-sm font-medium hover:text-teal-600 transition-colors"
                    >
                      Switch Role
                    </Link>
                    <Button onClick={handleLogout} variant="outline" className="mt-4 w-full">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 mt-4">
                    <Link href="/login">
                      <Button variant="outline" className="w-full">
                        Log In
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button className="w-full bg-teal-500 hover:bg-teal-600">
                        Get Started
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}