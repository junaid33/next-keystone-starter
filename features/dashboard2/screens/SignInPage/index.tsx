/**
 * SignInPage for Dashboard 2
 * Based on Keystone's SigninPage with Dashboard 1's ShadCN UI styling
 */

'use client'

import React, { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Database, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

interface SignInPageProps {
  identityField?: string
  secretField?: string
  error?: string
}

export function SignInPage({ 
  identityField = 'email', 
  secretField = 'password',
  error: serverError
}: SignInPageProps) {
  const router = useRouter()
  const [credentials, setCredentials] = useState({
    identity: '',
    secret: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(serverError || '')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!credentials.identity || !credentials.secret) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // TODO: Replace with actual authentication logic
      console.log('Signing in with:', credentials)
      
      // Mock authentication
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock success - redirect to dashboard
      router.push('/dashboard2')
      
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  const capitalizeFirstLetter = (str: string) => 
    str.charAt(0).toUpperCase() + str.slice(1)

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 p-6">
        {/* Logo/Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Database className="h-6 w-6" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground">
            Sign in to your admin dashboard
          </p>
        </div>

        {/* Sign In Form */}
        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Identity Field */}
              <div className="space-y-2">
                <Label htmlFor="identity">
                  {capitalizeFirstLetter(identityField)}
                </Label>
                <Input
                  id="identity"
                  name="identity"
                  type={identityField === 'email' ? 'email' : 'text'}
                  placeholder={`Enter your ${identityField}`}
                  value={credentials.identity}
                  onChange={(e) => setCredentials(prev => ({ 
                    ...prev, 
                    identity: e.target.value 
                  }))}
                  required
                  autoFocus
                  disabled={isLoading}
                />
              </div>

              {/* Secret Field */}
              <div className="space-y-2">
                <Label htmlFor="secret">
                  {capitalizeFirstLetter(secretField)}
                </Label>
                <div className="relative">
                  <Input
                    id="secret"
                    name="secret"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={`Enter your ${secretField}`}
                    value={credentials.secret}
                    onChange={(e) => setCredentials(prev => ({ 
                      ...prev, 
                      secret: e.target.value 
                    }))}
                    required
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !credentials.identity || !credentials.secret}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-background border-t-current rounded-full" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="text-center space-y-2">
          <div className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link 
              href="/dashboard2/signup" 
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </Link>
          </div>
          <div className="text-sm">
            <Link 
              href="/dashboard2/reset" 
              className="text-muted-foreground hover:text-primary hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <Separator />

        {/* Back to main site */}
        <div className="text-center">
          <Link 
            href="/" 
            className="text-sm text-muted-foreground hover:text-primary hover:underline"
          >
            ← Back to main site
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SignInPage