/**
 * InitPage for Dashboard 2
 * Based on Keystone's InitPage with Dashboard 1's ShadCN UI styling
 */

'use client'

import React, { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Database, User, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface InitPageProps {
  listKey?: string
  fieldPaths?: string[]
}

export function InitPage({ 
  listKey = 'User',
  fieldPaths = ['name', 'email', 'password'] 
}: InitPageProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Basic validation
    const missingFields = fieldPaths.filter(field => !formData[field]?.trim())
    if (missingFields.length > 0) {
      setError(`Please fill in all fields: ${missingFields.join(', ')}`)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // TODO: Replace with actual GraphQL mutation for creating initial user
      console.log('Creating initial user with data:', formData)
      
      // Mock creation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Redirect to dashboard after successful creation
      router.push('/dashboard2')
      
    } catch (err: any) {
      setError(err.message || 'Failed to create initial user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFieldChange = (fieldPath: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldPath]: value }))
  }

  const getFieldLabel = (fieldPath: string) => {
    const labels: Record<string, string> = {
      name: 'Full Name',
      email: 'Email Address',
      password: 'Password',
      username: 'Username'
    }
    return labels[fieldPath] || fieldPath.charAt(0).toUpperCase() + fieldPath.slice(1)
  }

  const getFieldType = (fieldPath: string) => {
    const types: Record<string, string> = {
      email: 'email',
      password: 'password'
    }
    return types[fieldPath] || 'text'
  }

  const getFieldPlaceholder = (fieldPath: string) => {
    const placeholders: Record<string, string> = {
      name: 'Enter your full name',
      email: 'Enter your email address',
      password: 'Choose a secure password',
      username: 'Choose a username'
    }
    return placeholders[fieldPath] || `Enter ${fieldPath}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 p-6">
        {/* Logo/Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Database className="h-8 w-8" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Welcome to Dashboard</h1>
            <p className="text-muted-foreground">
              Let's get started by creating your first admin user
            </p>
          </div>
        </div>

        {/* Setup Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Create your first user
            </CardTitle>
            <CardDescription>
              This will be your admin account for managing the dashboard
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

              {/* Dynamic form fields based on fieldPaths */}
              {fieldPaths.map((fieldPath) => (
                <div key={fieldPath} className="space-y-2">
                  <Label htmlFor={fieldPath}>
                    {getFieldLabel(fieldPath)}
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Input
                    id={fieldPath}
                    name={fieldPath}
                    type={getFieldType(fieldPath)}
                    placeholder={getFieldPlaceholder(fieldPath)}
                    value={formData[fieldPath] || ''}
                    onChange={(e) => handleFieldChange(fieldPath, e.target.value)}
                    required
                    disabled={isLoading}
                    autoFocus={fieldPath === fieldPaths[0]}
                  />
                </div>
              ))}

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
                  'Get started'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info */}
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm space-y-2">
              <p className="font-medium text-foreground">What happens next?</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• Your admin account will be created</li>
                <li>• You'll be signed in automatically</li>
                <li>• You can start managing your content</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default InitPage