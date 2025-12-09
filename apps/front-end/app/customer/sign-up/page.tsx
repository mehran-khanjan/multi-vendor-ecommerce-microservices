"use client"

import Link from "next/link"
import { useForm } from "react-hook-form"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SignUpFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  agreeToTerms: boolean
}

export default function SignUpPage() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpFormData>({
    mode: "onBlur",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
  })

  const password = watch("password")

  const onSubmit = (data: SignUpFormData) => {
    console.log("Sign up data:", data)
    // Handle sign up submission
  }

  return (
    <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md px-4"
      >
        <div className="glass rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 text-center">Get Started</h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-center mb-8">Create your account</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">First Name</label>
                <Input
                  placeholder="John"
                  className={`rounded-lg ${errors.firstName ? "border-red-500" : ""}`}
                  {...register("firstName", {
                    required: "First name is required",
                    minLength: {
                      value: 2,
                      message: "First name must be at least 2 characters",
                    },
                  })}
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Last Name</label>
                <Input
                  placeholder="Doe"
                  className={`rounded-lg ${errors.lastName ? "border-red-500" : ""}`}
                  {...register("lastName", {
                    required: "Last name is required",
                    minLength: {
                      value: 2,
                      message: "Last name must be at least 2 characters",
                    },
                  })}
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                className={`rounded-lg ${errors.email ? "border-red-500" : ""}`}
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                className={`rounded-lg ${errors.password ? "border-red-500" : ""}`}
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters",
                  },
                })}
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Confirm Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                className={`rounded-lg ${errors.confirmPassword ? "border-red-500" : ""}`}
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (value) => value === password || "Passwords do not match",
                })}
              />
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded mt-1"
                {...register("agreeToTerms", {
                  required: "You must agree to the terms",
                })}
              />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                I agree to the{" "}
                <Link href="#" className="font-medium hover:underline">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="#" className="font-medium hover:underline">
                  Privacy Policy
                </Link>
              </span>
            </label>
            {errors.agreeToTerms && <p className="text-red-500 text-sm">{errors.agreeToTerms.message}</p>}

            <Button type="submit" className="w-full rounded-lg h-11">
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400 mt-6">
            Already have an account?{" "}
            <Link href="/log-in" className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
