"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Crown, Loader2, Eye, EyeOff, IdCard, Key } from "lucide-react"
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
    <div className="container flex min-h-screen items-center justify-center py-12 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto bg-amber-100 rounded-full h-16 w-16 flex items-center justify-center mb-4">
            <Crown className="h-10 w-10 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold">Member Login</h1>
          <p className="text-muted-foreground mt-1">Sign in with your Member ID and password</p>
        </div>

        <Card>
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
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              className="w-full bg-amber-600 hover:bg-amber-700"
              onClick={handleLogin}
              disabled={logging || !memberId || !password}
            >
              {logging ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {logging ? "Signing in..." : "Sign In"}
            </Button>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <p className="text-xs text-muted-foreground text-center">
              Don&apos;t have a member ID?{" "}
              <a href="/contact" className="text-primary underline">Contact RIC</a> to become a member.
            </p>
            <p className="text-xs text-muted-foreground text-center">
              <Link href="/login" className="text-primary hover:underline">Website Login</Link> for regular users
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
