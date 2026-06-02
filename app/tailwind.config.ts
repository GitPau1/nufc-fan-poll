import type { Config } from "tailwindcss"
import { fontFamily } from "tailwindcss/defaultTheme"

const config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        black:      "var(--c-black)",
        "gray-1":   "var(--c-gray-1)",
        "gray-2":   "var(--c-gray-2)",
        "gray-3":   "var(--c-gray-3)",
        "gray-4":   "var(--c-gray-4)",
        disabled:   "var(--c-disabled)",
        surface:    "var(--c-surface)",
        "primary-dim":  "var(--c-primary-dim)",
        "primary-dark": "var(--c-primary-dark)",
        positive:       "var(--c-positive)",
        "positive-dim": "var(--c-positive-dim)",
        negative:       "var(--c-negative)",
        "negative-dim": "var(--c-negative-dim)",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },
      borderRadius: {
        xs:   "var(--r-xs)",
        sm:   "var(--r-sm)",
        md:   "var(--r-md)",
        lg:   "var(--r-lg)",
        pill: "var(--r-pill)",
      },
      boxShadow: {
        w100: "var(--sh-w100)",
        w200: "var(--sh-w200)",
        w300: "var(--sh-w300)",
        g100: "var(--sh-g100)",
        g200: "var(--sh-g200)",
        g300: "var(--sh-g300)",
      },
      fontFamily: {
        sans: ["Pretendard Variable", "Pretendard", ...fontFamily.sans],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
