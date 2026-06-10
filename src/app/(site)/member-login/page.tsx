"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Crown, Loader2, Eye, EyeOff, IdCard, Key, ArrowRight, Star } from "lucide-react"
import { useMemberAuth } from "@/hooks/use-member-auth"

export default function MemberLoginPage() {
  const { memberLogin } = useMemberAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const { toast } = useToast();

  const [memberId, setMemberId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [logging, setLogging] = useState(false);

  const handleLogin = async () => {
    if (!memberId || !password) return;
    setLogging(true);
    const result = await memberLogin(memberId, password);
    if (result.success) {
      toast({ title: "Welcome!", description: "Logged in as RIC member." });
      router.push(redirect || "/member/dashboard");
    } else {
      toast({ variant: "destructive", title: "Login Failed", description: result.error || "Invalid credentials." });
    }
    setLogging(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-background items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl" />
        <div className="relative text-center max-w-md px-8">
          <div className="h-20 w-20 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
            <Crown className="h-10 w-10 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold mb-3">RIC Member Portal</h2>
          <p className="text-muted-foreground leading-relaxed">
            Access your exclusive member benefits, book free seats for events, and manage your membership.
          </p>
          <div className="flex items-center gap-4 mt-8 justify-center">
            {[
              { icon: Star, text: "Free seats" },
              { icon: Crown, text: "Priority access" },
              { icon: ArrowRight, text: "Quick booking" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <item.icon className="h-4 w-4 text-amber-500" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm animate-[fadeInUp_0.6s_ease-out]">
          <div className="text-center mb-8">
            <div className="mx-auto bg-amber-100 dark:bg-amber-900/30 rounded-2xl h-16 w-16 flex items-center justify-center mb-4">
              <Crown className="h-9 w-9 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold">Member Login</h1>
            <p className="text-muted-foreground mt-1">Sign in with your Member ID and password</p>
          </div>

          <Card className="border-0 shadow-none md:border md:shadow-sm">
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
                  <IdCard className="h-4 w-4 text-muted-foreground" /> Member ID
                </label>
                <Input
                  placeholder="e.g. 13"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="h-11"
                />
              </div>

              <div>
                <label className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
                  <Key className="h-4 w-4 text-muted-foreground" /> Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    className="h-11 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                className="w-full h-11 font-semibold bg-amber-600 hover:bg-amber-700 text-white"
                onClick={handleLogin}
                disabled={logging || !memberId || !password}
              >
                {logging ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Crown className="h-4 w-4 mr-2" />}
                {logging ? "Signing in..." : "Sign In as Member"}
              </Button>
            </CardContent>
            <CardFooter className="flex-col gap-3">
              <p className="text-xs text-muted-foreground text-center">
                Don&apos;t have a member ID?{" "}
                <a href="/contact" className="text-primary underline hover:no-underline">Contact RIC</a> to become a member.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                <span>OR</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <Link href="/login" className="text-sm text-primary hover:underline font-medium">
                Website Login for regular users
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
