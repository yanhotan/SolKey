import type { Metadata } from "next"
import Link from "next/link"
import { SignupForm } from "@/components/signup-form"

export const metadata: Metadata = {
  title: "Sign Up - SolSecure",
  description: "Create a new SolSecure account",
}

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-background/80 p-4 md:p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Create an account</h1>
          <p className="text-muted-foreground">Enter your information to get started</p>
        </div>
        <SignupForm />
        <div className="text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="underline underline-offset-4 hover:text-primary">
            Log in
          </Link>
        </div>
      </div>
    </div>
  )
}
