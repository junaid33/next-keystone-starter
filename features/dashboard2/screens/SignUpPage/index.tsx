/**
 * SignUpPage for Dashboard 2
 * User registration with Dashboard 1's ShadCN UI styling
 */

'use client'

import React, { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Database, Eye, EyeOff, AlertTriangle, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'

interface SignUpPageProps {
  allowRegistration?: boolean
}

export function SignUpPage({ allowRegistration = false }: SignUpPageProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (!agreedToTerms) {
      setError('Please agree to the terms and conditions')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // TODO: Replace with actual registration logic
      console.log('Registering user with:', formData)
      
      // Mock registration
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Redirect to sign in after successful registration
      router.push('/dashboard2/signin?message=registration-success')
      
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // If registration is not allowed, show a message
  if (!allowRegistration) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-6 p-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Database className="h-6 w-6" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">Registration Disabled</h1>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto" />
                <div className="space-y-2">
                  <h3 className="font-semibold">Registration Not Available</h3>
                  <p className="text-sm text-muted-foreground">
                    New user registration is currently disabled. Please contact your administrator 
                    for access to the dashboard.
                  </p>
                </div>
                <Button asChild className="w-full">
                  <Link href="/dashboard2/signin">
                    Sign in instead
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

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
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground">
            Get started with your admin dashboard
          </p>
        </div>

        {/* Sign Up Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Sign up
            </CardTitle>
            <CardDescription>
              Create your admin account to get started
            </CardDescription>
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

              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  required
                  autoFocus
                  disabled={isLoading}
                />
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a secure password"
                    value={formData.password}
                    onChange={(e) => handleFieldChange('password', e.target.value)}
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

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                    required
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  disabled={isLoading}
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the{' '}
                  <Link href="/terms" className="text-primary hover:underline">
                    terms and conditions
                  </Link>
                </Label>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-background border-t-current rounded-full" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="text-center space-y-2">
          <div className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link 
              href="/dashboard2/signin" 
              className="font-medium text-primary hover:underline"
            >
              Sign in
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

export default SignUpPage