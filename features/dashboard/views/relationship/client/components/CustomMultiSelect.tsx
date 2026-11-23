import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { XIcon, ChevronDown } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

export interface Option {
  value: string;
  label: string;
  data?: any;
}

interface CustomMultiSelectProps {
  value?: Option[];
  options?: Option[];
  onChange?: (options: Option[]) => void;
  onInputChange?: (value: string) => Promise<Option[]>;
  placeholder?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  className?: string;
  isClearable?: boolean;
}

export function CustomMultiSelect({
  value = [],
  options = [],
  onChange,
  onInputChange,
  placeholder = "Select...",
  isLoading = false,
  isDisabled = false,
  className,
  isClearable = true,
}: CustomMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [availableOptions, setAvailableOptions] = useState<Option[]>(options);
  const inputRef = useRef<HTMLInputElement>(null);
  const commandRef = useRef<HTMLDivElement>(null);

  // Update available options when options prop changes
  useEffect(() => {
    setAvailableOptions(options);
  }, [options]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        commandRef.current &&
        !commandRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = useCallback(
    async (newInputValue: string) => {
      setInputValue(newInputValue);
      if (onInputChange) {
        const newOptions = await onInputChange(newInputValue);
        setAvailableOptions(newOptions);
      }
    },
    [onInputChange]
  );

  const handleSelect = useCallback(
    (option: Option) => {
      if (!value.some((v) => v.value === option.value)) {
        const newValue = [...value, option];
        onChange?.(newValue);
      }
      setInputValue("");
    },
    [value, onChange]
  );

  const handleRemove = useCallback(
    (optionToRemove: Option) => {
      const newValue = value.filter((v) => v.value !== optionToRemove.value);
      onChange?.(newValue);
    },
    [value, onChange]
  );

  const handleClearAll = useCallback(() => {
    onChange?.([]);
  }, [onChange]);

  // Filter out selected options
  const filteredOptions = availableOptions.filter(
    (option) => !value.some((v) => v.value === option.value)
  );

  return (
    <div className="relative" ref={commandRef}>
      <div
        className={cn(
          "ks-field flex min-h-8 w-full items-center justify-between gap-2 py-1 pl-1 pr-2 text-left text-[13px]",
          isDisabled && "cursor-not-allowed opacity-50",
          className
        )}
        onClick={() => {
          if (!isDisabled) {
            setOpen(true);
            inputRef.current?.focus();
          }
        }}
      >
        <div className="flex flex-wrap gap-1">
          {value.map((option) => (
            <div
              key={option.value}
              className="animate-fadeIn ks-raised relative inline-flex h-6 max-w-full cursor-default items-center rounded-[6px] ps-2 pe-6 text-[12px] font-medium text-[var(--ks-ink)]"
            >
              <span className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]">{option.label}</span>
              {!isDisabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(option);
                  }}
                  aria-label={`Remove ${option.label}`}
                  className="absolute inset-y-0 end-0 flex w-6 items-center justify-center rounded-e-[6px] text-[var(--ks-label)] outline-none hover:text-[var(--ks-ink)] focus-visible:ring-2 focus-visible:ring-[var(--ks-focus)]"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          <input
            ref={inputRef}
            disabled={isDisabled}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            className={cn(
              "h-6 flex-1 bg-transparent px-1.5 outline-none placeholder:text-[var(--ks-label)]",
              value.length === 0 ? "w-full" : "w-20"
            )}
            placeholder={value.length === 0 ? placeholder : ""}
          />
        </div>
        <div className="flex items-center gap-1">
          {isClearable && value.length > 0 && !isDisabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClearAll();
              }}
              aria-label="Clear all"
              className="flex size-6 items-center justify-center rounded-[6px] text-[var(--ks-label)] outline-none hover:text-[var(--ks-ink)] focus-visible:ring-2 focus-visible:ring-[var(--ks-focus)]"
            >
              <XIcon className="size-3.5" />
            </button>
          )}
          <ChevronDown className="size-3.5 shrink-0 text-[var(--ks-label)]" />
        </div>
      </div>
      {open && (
        <div className="absolute z-50 mt-1.5 w-full max-w-[400px]">
          <Command className="ks-pop">
            <CommandList>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="size-4 animate-spin rounded-full border-2 border-[var(--ks-accent)] border-t-transparent" />
                </div>
              ) : (
                <>
                  {filteredOptions.length === 0 ? (
                    <CommandEmpty className="py-4 text-center text-[12px] text-[var(--ks-dim)]">
                      {inputValue.length > 0 ? (
                        <>No matches</>
                      ) : availableOptions.length === 0 ? (
                        <>None</>
                      ) : (
                        <>All added</>
                      )}
                    </CommandEmpty>
                  ) : (
                    <CommandGroup>
                      {filteredOptions.map((option) => (
                        <div className="px-1 py-0.5" key={option.value}>
                          <div 
                            onClick={() => handleSelect(option)}
                            className="relative cursor-pointer rounded-[7px] px-2 py-1.5 text-[13px] outline-none hover:bg-[var(--ks-hover)]"
                          >
                            <div className="flex-1 whitespace-normal break-words overflow-visible min-w-0 pr-2">
                              {option.label}
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
        </div>
      )}
    </div>
  );
} 