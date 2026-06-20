import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] text-sm font-bold transition-all duration-200 cursor-pointer disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-red-primary text-white hover:bg-yellow hover:text-black",
        destructive: "bg-red-primary text-white hover:bg-red-light",
        outline:
          "border-2 border-white/10 bg-white/5 text-white hover:border-gray-500",
        secondary: "bg-yellow text-black hover:bg-yellow-light",
        ghost: "text-white/70 hover:bg-white/10 hover:text-white",
        link: "text-red-primary underline-offset-4 hover:underline",
        whatsapp: "bg-[#25d366] text-white hover:bg-[#1da851]",
      },
      size: {
        default: "h-11 px-4 py-3",
        sm: "h-9 px-3 text-xs",
        lg: "h-14 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
