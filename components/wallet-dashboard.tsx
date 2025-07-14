'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useWallet } from '@/contexts/WalletContext'
import { useAuth } from '@/contexts/AuthContext'
import { formatXLM, getExplorerUrl, getTransactionUrl } from '@/lib/stellar-client'
import { Copy, RefreshCw, Send, LogOut, ExternalLink, Anchor } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface WalletDashboardProps {
  onSendPayment: () => void
  onAnchorInteraction: () => void
}

export function WalletDashboard({ onSendPayment, onAnchorInteraction }: WalletDashboardProps) {
  const { user, signOut } = useAuth()
  const { wallet, account, refreshAccount, loading } = useWallet()
  const [recentTx, setRecentTx] = useState<string | null>(null)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false)

  useEffect(() => {
    if (wallet.isConnected && wallet.publicKey) {
      refreshAccount()
      
      // Enable auto-refresh for unfunded accounts (to detect funding)
      if (!account?.exists) {
        setAutoRefreshEnabled(true)
      }
    }
  }, [wallet.isConnected, wallet.publicKey, refreshAccount, account?.exists])

  // Auto-refresh effect for unfunded accounts
  useEffect(() => {
    if (autoRefreshEnabled && wallet.isConnected && (!account?.exists || account?.balance === '0')) {
      const interval = setInterval(() => {
        refreshAccount()
      }, 5000) // Check every 5 seconds
      
      return () => {
        clearInterval(interval)
      }
    }
  }, [autoRefreshEnabled, wallet.isConnected, account?.exists, account?.balance, refreshAccount])

  // Disable auto-refresh when account becomes funded
  useEffect(() => {
    if (account?.exists && parseFloat(account.balance) > 0) {
      if (autoRefreshEnabled) {
        setAutoRefreshEnabled(false)
        toast.success('💰 Balance updated! Your wallet is now funded.')
      }
    }
  }, [account?.exists, account?.balance, autoRefreshEnabled])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Address copied to clipboard")
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const openInExplorer = () => {
    if (wallet.publicKey) {
      const explorerUrl = getExplorerUrl(wallet.publicKey)
      window.open(explorerUrl, '_blank')
    }
  }

  const openTransaction = (hash: string) => {
    const txUrl = getTransactionUrl(hash)
    window.open(txUrl, '_blank')
  }

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success("You have been logged out successfully")
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (!wallet.isConnected || !wallet.publicKey || !user) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">Wallet not connected</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* User Profile */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-lg">
                {user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{user.name || user.email}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
              <Badge variant="secondary" className="mt-1 capitalize">
                {user.provider}
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wallet Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Stellar Wallet
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshAccount}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading || autoRefreshEnabled ? 'animate-spin' : ''}`} />
                  {autoRefreshEnabled ? 'Auto-refreshing...' : 'Refresh'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Balance */}
              <div className="text-center py-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">XLM Balance</p>
                <p className="text-4xl font-bold text-gray-900">
                  {account ? formatXLM(account.balance) : '0'} XLM
                </p>
                {account && !account.exists && (
                  <div className="mt-2 space-y-1">
                    <Badge variant="outline">
                      Account not yet funded
                    </Badge>
                    {autoRefreshEnabled && (
                      <Badge variant="secondary" className="ml-2">
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        Watching for funding
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Wallet Address */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Wallet Address
                </label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 p-3 bg-gray-100 rounded text-sm font-mono break-all">
                    {wallet.publicKey}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(wallet.publicKey!)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openInExplorer}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Details */}
          {account && account.exists && (
            <Card>
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Sequence Number</p>
                  <p className="font-mono text-sm">{account.sequence}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Subentry Count</p>
                  <p className="font-mono text-sm">{account.subentryCount}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Asset Balances</p>
                  <div className="space-y-1">
                    {account.balances.map((balance: any, index: number) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-sm">
                          {balance.asset_type === 'native' ? 'XLM' : `${balance.asset_code}:${balance.asset_issuer.slice(0, 8)}...`}
                        </span>
                        <span className="text-sm font-mono">{formatXLM(balance.balance)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={onSendPayment}
                className="w-full"
                disabled={!account?.exists}
              >
                <Send className="w-4 h-4 mr-2" />
                Send Payment
              </Button>
              
              <Button 
                onClick={onAnchorInteraction}
                variant="outline"
                className="w-full"
                disabled={!account?.exists}
              >
                <Anchor className="w-4 h-4 mr-2" />
                Anchor Services
              </Button>
              
            </CardContent>
          </Card>

          {/* Stellar Features */}
          <Card>
            <CardHeader>
              <CardTitle>Advanced Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">SEP-10 Auth</span>
                <Badge variant="secondary">Ready</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">SEP-24 Deposits</span>
                <Badge variant="secondary">Ready</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Stellar SDK</span>
                <Badge variant="secondary">Active</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transaction */}
          {recentTx && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openTransaction(recentTx)}
                  className="w-full"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Transaction
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}