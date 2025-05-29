"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { FieldContainer } from "@/components/ui/field-container"
import { FieldLabel } from "@/components/ui/field-label"
import { FieldDescription } from "@/components/ui/field-description"

interface Field {
  path: string
  label: string
  description?: string
  fieldMeta?: {
    isRequired?: boolean
    minLength?: number
    maxLength?: number
  }
}

interface FieldProps {
  field: Field
  value?: any
  onChange?: (value: any) => void
  forceValidation?: boolean
}

interface FilterProps {
  value: string | number
  onChange: (value: string | number) => void
}

interface CellProps {
  item: Record<string, any>
  field: Field
}

interface FilterTypes {
  is_set: { label: string; initialValue: string }
  length_gt: { label: string; initialValue: string }
  length_lt: { label: string; initialValue: string }
}

interface Config {
  path: string
  label: string
  description?: string
  fieldMeta?: {
    isRequired?: boolean
    minLength?: number
    maxLength?: number
  }
}

interface PasswordValue {
  kind: 'value' | 'error'
  value?: string
  errors?: string[]
}

interface ValidationState {
  kind: 'initial' | 'value' | 'error'
  value?: string
}

interface ValidationConfig {
  isRequired?: boolean
  length?: {
    min?: number
    max?: number
  }
  match?: {
    regex: RegExp
    explanation: string
  }
}

/**
 * Filter component for password fields
 */
export function Filter({ value, onChange }: FilterProps) {
  return (
    <ToggleGroup
      type="single"
      value={value.toString()}
      onValueChange={(val) => {
        onChange(Number(val));
      }}
    >
      <ToggleGroupItem value="0">Is Not Set</ToggleGroupItem>
      <ToggleGroupItem value="1">Is Set</ToggleGroupItem>
    </ToggleGroup>
  )
}

/**
 * Get available filter types for password fields
 */
export function getFilterTypes(): FilterTypes {
  return {
    is_set: {
      label: "Is set",
      initialValue: "true",
    },
    length_gt: {
      label: "Length greater than",
      initialValue: "",
    },
    length_lt: {
      label: "Length less than",
      initialValue: "",
    },
  }
}

/**
 * Cell component for rendering password status in a list view
 */
export function Cell({ item, field }: CellProps) {
  const value = item[field.path]
  if (!value) return <span className="text-muted-foreground">Not set</span>
  return <span>••••••••</span>
}

// Validation function for password fields
function validate(state: ValidationState, validation: ValidationConfig, label: string): string | undefined {
  if (state.kind === 'initial') {
    return undefined;
  }

  const value = state.value;
  if (!value && validation?.isRequired) {
    return `${label} is required`;
  }

  if (value && validation?.length?.min && value.length < validation.length.min) {
    return `${label} must be at least ${validation.length.min} characters long`;
  }

  if (value && validation?.length?.max && value.length > validation.length.max) {
    return `${label} must be no longer than ${validation.length.max} characters`;
  }

  if (value && validation?.match && !validation.match.regex.test(value)) {
    return validation.match.explanation || `${label} must match ${validation.match.regex}`;
  }

  return undefined;
}

export const controller = (config: Config) => {
  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: config.path,
    defaultValue: { kind: "value" as const, value: "" },
    deserialize(item: Record<string, any>): PasswordValue {
      const value = item[config.path]
      if (!value) return { kind: "value", value: "" }
      return { kind: "value", value }
    },
    validate(value: PasswordValue): boolean {
      if (!value) return true
      if (value.kind === "error") return false
      
      const password = value.value || ""
      
      if (config.fieldMeta?.isRequired && !password) {
        return false
      }
      
      if (config.fieldMeta?.minLength && password.length < config.fieldMeta.minLength) {
        return false
      }
      
      if (config.fieldMeta?.maxLength && password.length > config.fieldMeta.maxLength) {
        return false
      }
      
      return true
    },
    serialize(value: PasswordValue) {
      if (!value || value.kind === "error") return {}
      return { [config.path]: value.value }
    },
    filter: {
      Filter({ value, onChange }: FilterProps) {
        return (
          <ToggleGroup
            type="single"
            value={value.toString()}
            onValueChange={(val) => {
              onChange(Number(val));
            }}
          >
            <ToggleGroupItem value="0">Is Not Set</ToggleGroupItem>
            <ToggleGroupItem value="1">Is Set</ToggleGroupItem>
          </ToggleGroup>
        );
      },
      graphql: ({ value }: { value: boolean }) => {
        return { [config.path]: { isSet: value } };
      },
      Label({ value }: { value: boolean }) {
        return value ? "is set" : "is not set";
      },
      types: {
        is_set: {
          label: "Is Set",
          initialValue: true,
        },
      },
    },
  };
};

export function Field({ field, value, onChange, forceValidation }: FieldProps) {
  const [isDirty, setIsDirty] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const validate = (password: string): string | null => {
    if (!password && field.fieldMeta?.isRequired) {
      return "This field is required"
    }
    
    if (field.fieldMeta?.minLength && password.length < field.fieldMeta.minLength) {
      return `Password must be at least ${field.fieldMeta.minLength} characters`
    }
    
    if (field.fieldMeta?.maxLength && password.length > field.fieldMeta.maxLength) {
      return `Password must be no more than ${field.fieldMeta.maxLength} characters`
    }
    
    return null
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value
    setIsDirty(true)
    
    const validationError = validate(password)
    setError(validationError)
    
    if (onChange) {
      if (validationError) {
        onChange({ kind: "error", errors: [validationError] })
      } else {
        onChange({ kind: "value", value: password })
      }
    }
  }
  
  const toggleShowPassword = () => {
    setShowPassword(!showPassword)
  }
  
  const showError = (isDirty || forceValidation) && error
  
  return (
    <FieldContainer>
      <FieldLabel htmlFor={field.path}>
        {field.label}
        {field.fieldMeta?.isRequired && <span className="text-destructive ml-1">*</span>}
      </FieldLabel>
      
      <div className="relative">
        <Input
          id={field.path}
          type={showPassword ? "text" : "password"}
          value={value?.value || ""}
          onChange={handleChange}
          className={showError ? "border-destructive" : ""}
        />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-2 top-1/2 -translate-y-1/2"
          onClick={toggleShowPassword}
        >
          {showPassword ? (
            <EyeOffIcon className="h-4 w-4" />
          ) : (
            <EyeIcon className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {showError && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      
      {field.description && (
        <FieldDescription id={`${field.path}-description`}>
          {field.description}
        </FieldDescription>
      )}
    </FieldContainer>
  )
}

