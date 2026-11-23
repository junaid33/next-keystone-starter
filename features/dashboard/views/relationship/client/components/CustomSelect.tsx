"use client"

import * as React from "react"
import { Check, ChevronDown, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Option } from "./CustomMultiSelect"
import { Select as ShadcnSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CustomSelectProps {
  value?: Option | null;
  options?: Option[];
  onChange?: (option: Option | null) => void;
  onInputChange?: (value: string) => Promise<Option[]>;
  placeholder?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  className?: string;
  isClearable?: boolean;
}

export function CustomSelect({
  value,
  options = [],
  onChange,
  onInputChange,
  placeholder = "Select...",
  isLoading = false,
  isDisabled = false,
  className,
  isClearable = true,
}: CustomSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const [availableOptions, setAvailableOptions] = React.useState<Option[]>(options)

  // Update available options when options prop changes
  React.useEffect(() => {
    setAvailableOptions(options)
  }, [options])

  const handleInputChange = React.useCallback(
    async (newInputValue: string) => {
      setInputValue(newInputValue)
      if (onInputChange) {
        const newOptions = await onInputChange(newInputValue)
        setAvailableOptions(newOptions)
      }
    },
    [onInputChange]
  )

  const handleSelect = React.useCallback(
    (option: Option | null) => {
      // If selecting the same value, clear it (toggle behavior)
      if (value && option && value.value === option.value) {
        onChange?.(null)
      } else {
        onChange?.(option)
      }
      setOpen(false)
      setInputValue("")
    },
    [onChange, value]
  )

  const handleClear = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onChange?.(null)
    },
    [onChange]
  )

  // Implementation exactly matching shadcn SelectTrigger
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="button"
          tabIndex={isDisabled ? -1 : 0}
          className={cn(
            "ks-field flex h-8 w-full cursor-pointer items-center justify-between gap-2 pl-2.5 pr-2 text-left text-[13px] focus-visible:outline-none [&>span]:line-clamp-1",
            isDisabled && "cursor-not-allowed opacity-50",
            className
          )}
          onClick={(e) => {
            e.preventDefault();
            if (!isDisabled) {
              setOpen(true)
            }
          }}
          onKeyDown={(e) => {
            if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              setOpen(true);
            }
          }}
          aria-disabled={isDisabled}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className={cn("w-full min-w-0 truncate text-left", !value && "text-[var(--ks-label)]")}>{value ? value.label : placeholder}</span>
          
          {/* This exactly matches the SelectTrigger's chevron area */}
          <div className="flex items-center">
            {isClearable && value && !isDisabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear(e);
                }}
                aria-label="Clear"
                className="flex size-6 items-center justify-center rounded-[6px] text-[var(--ks-label)] outline-none hover:text-[var(--ks-ink)] focus-visible:ring-2 focus-visible:ring-[var(--ks-focus)]"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
            <ChevronDown className="size-3.5 shrink-0 text-[var(--ks-label)]" />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 max-w-[400px]" align="start">
        <Command>
          <div className="flex items-center border-b border-[var(--ks-line)] px-3" cmdk-input-wrapper="">
            <input
              placeholder="Search"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              className="flex h-9 w-full bg-transparent text-[13px] outline-none placeholder:text-[var(--ks-label)] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="size-4 animate-spin rounded-full border-2 border-[var(--ks-accent)] border-t-transparent" />
              </div>
            ) : (
              <>
                {availableOptions.length === 0 ? (
                  <CommandEmpty className="py-4 text-center text-[12px] text-[var(--ks-dim)]">
                    {inputValue.length > 0 ? (
                      <>No matches</>
                    ) : (
                      <>None</>
                    )}
                  </CommandEmpty>
                ) : (
                  <CommandGroup>
                    {availableOptions.map((option) => (
                      <div className="px-1 py-0.5" key={option.value}>
                        <div 
                          onClick={() => handleSelect(option)}
                          className={cn(
                            "relative cursor-pointer rounded-[7px] px-2 py-1.5 text-[13px] outline-none hover:bg-[var(--ks-hover)]",
                            value?.value === option.value && "bg-accent text-accent-foreground"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <div className="flex-1 whitespace-normal break-words overflow-visible min-w-0 pr-2">
                              {option.label}
                            </div>
                            {value?.value === option.value && (
                              <div className="flex-shrink-0 mt-0.5">
                                <Check className="size-3.5 text-[var(--ks-accent)]" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
