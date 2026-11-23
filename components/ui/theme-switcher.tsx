"use client";

import { cn } from "@/lib/utils";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { type ComponentProps, useDeferredValue } from "react";

const THEMES = [
  { type: "system", icon: Monitor, label: "System" },
  { type: "light", icon: Sun, label: "Light" },
  { type: "dark", icon: Moon, label: "Dark" },
] as const;

type Theme = (typeof THEMES)[number]["type"];

interface ThemeSwitcherProps
  extends Omit<ComponentProps<"div">, "onChange" | "value" | "defaultValue"> {
  value?: Theme;
  onChange?: (theme: Theme) => void;
  defaultValue?: Theme;
  /** Show the text label next to each icon. */
  withLabels?: boolean;
}

/** System / light / dark as a segmented control: raised pill in a recessed track. */
function ThemeSwitcher({ value, onChange, defaultValue, withLabels = false, className, ...props }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const deferredTheme = useDeferredValue(theme, "system");

  return (
    <div role="radiogroup" aria-label="Theme" className={cn("ks-track ks-seg", className)} data-theme-switcher {...props}>
      {THEMES.map(({ type, icon: Icon, label }) => {
        const isActive = deferredTheme === type;
        return (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            title={label}
            onClick={() => setTheme(type)}
            className={cn(!withLabels && "!px-1.5")}
          >
            <Icon className="size-3.5" />
            {withLabels && <span>{label}</span>}
          </button>
        );
      })}
    </div>
  );
}

export { ThemeSwitcher };
