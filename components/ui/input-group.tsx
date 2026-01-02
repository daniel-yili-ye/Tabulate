"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils/cn"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const inputGroupVariants = cva(
  "flex w-full rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow]",
  {
    variants: {
      variant: {
        default: [
          "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
          "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        ],
        outline: [
          "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
          "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface InputGroupProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof inputGroupVariants> {}

function InputGroup({ className, variant, ...props }: InputGroupProps) {
  return (
    <div
      data-slot="input-group"
      className={cn(inputGroupVariants({ variant }), className)}
      {...props}
    />
  )
}

function InputGroupInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="input-group-input"
      className={cn(
        "flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0",
        className
      )}
      {...props}
    />
  )
}

function InputGroupTextarea({
  className,
  ...props
}: React.ComponentProps<typeof Textarea>) {
  return (
    <Textarea
      data-slot="input-group-textarea"
      className={cn(
        "flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 resize-none",
        className
      )}
      {...props}
    />
  )
}

const inputGroupAddonVariants = cva(
  "flex shrink-0 items-center justify-center gap-2 text-muted-foreground",
  {
    variants: {
      align: {
        "inline-start": "ps-3 order-first",
        "inline-end": "pe-3 order-last",
        "block-start": "pt-2 px-3 order-first",
        "block-end": "pb-2 px-3 order-last",
      },
    },
    defaultVariants: {
      align: "inline-end",
    },
  }
)

interface InputGroupAddonProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof inputGroupAddonVariants> {}

function InputGroupAddon({
  className,
  align,
  ...props
}: InputGroupAddonProps) {
  return (
    <div
      data-slot="input-group-addon"
      className={cn(inputGroupAddonVariants({ align }), className)}
      {...props}
    />
  )
}

function InputGroupText({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="input-group-text"
      className={cn("text-sm", className)}
      {...props}
    />
  )
}

function InputGroupButton({
  className,
  variant = "ghost",
  size = "icon-sm",
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="input-group-button"
      variant={variant}
      size={size}
      className={cn("shrink-0", className)}
      {...props}
    />
  )
}

export {
  InputGroup,
  InputGroupInput,
  InputGroupTextarea,
  InputGroupAddon,
  InputGroupText,
  InputGroupButton,
}

