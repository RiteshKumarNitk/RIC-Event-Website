"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { useMemberAuth } from "@/hooks/use-member-auth"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, Mail, Lock, Loader2, ArrowRight, Crown, IdCard, Key, User } from "lucide-react"
import { useState, Suspense } from "react"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

function LoginForm() {
  const { login, signInWithGoogle } = useAuth();
  const { memberLogin } = useMemberAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const modeParam = searchParams.get("mode");
  const { toast } = useToast();

  const [loginMode, setLoginMode] = useState<"website" | "member">(modeParam === "member" ? "member" : "website");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Member login fields
  const [memberId, setMemberId] = useState("");
  const [memberPassword, setMemberPassword] = useState("");
  const [showMemberPassword, setShowMemberPassword] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleWebsiteLogin = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      const result = await login(values.email, values.password);
      if (result?.error) {
        toast({ variant: "destructive", title: "Login Failed", description: result.error });
        setIsLoading(false);
        return;
      }
      toast({ title: "Welcome back!", description: "Logged in successfully." });
      router.push(redirect || "/account");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Login Failed", description: error.message || "An unexpected error occurred." });
      setIsLoading(false);
    }
  };

  const handleMemberLogin = async () => {
    if (!memberId || !memberPassword) return;
    setIsLoading(true);
    try {
      const result = await memberLogin(memberId, memberPassword);
      if (result.success) {
        toast({ title: "Welcome, Member!", description: "Logged in as RIC member." });
        router.push(redirect || "/member/dashboard");
      } else {
        toast({ variant: "destructive", title: "Login Failed", description: result.error || "Invalid credentials." });
      }
    } catch {
      toast({ variant: "destructive", title: "Login Failed", description: "An unexpected error occurred." });
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      toast({ title: "Success", description: "Logged in with Google!" });
      router.push(redirect || "/account");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Google Sign-In Failed", description: error.message });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm animate-[fadeInUp_0.6s_ease-out]">
          <div className="text-center mb-8">
            <div className={`mx-auto rounded-2xl h-16 w-16 flex items-center justify-center mb-4 transition-colors ${
              loginMode === "member" ? "bg-amber-100 dark:bg-amber-900/30" : "bg-primary/10"
            }`}>
              {loginMode === "member" ? (
                <Crown className="h-9 w-9 text-amber-600" />
              ) : (
                <User className="h-9 w-9 text-primary" />
              )}
            </div>
            <h1 className="text-3xl font-bold">
              {loginMode === "member" ? "Member Login" : "Welcome back"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {loginMode === "member" ? "Sign in with your Member ID and password" : "Sign in to your account"}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-muted p-1 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => setLoginMode("website")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                loginMode === "website"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="h-4 w-4 inline mr-1.5" />
              Website Login
            </button>
            <button
              type="button"
              onClick={() => setLoginMode("member")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                loginMode === "member"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Crown className="h-4 w-4 inline mr-1.5" />
              Member Login
            </button>
          </div>

          {loginMode === "website" ? (
            <Card className="border-0 shadow-none md:border md:shadow-sm">
              <CardContent className="pt-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleWebsiteLogin)} className="grid gap-4">
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <FormControl><Input type="email" placeholder="m@example.com" className="pl-9 h-11" {...field} /></FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="password" render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Password</FormLabel>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <FormControl><Input type={showPassword ? "text" : "password"} placeholder="Enter your password" className="pl-9 pr-9 h-11" {...field} /></FormControl>
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full h-11 font-semibold" disabled={isLoading}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </Form>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full h-11 font-medium" onClick={handleGoogleSignIn} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : (
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  )}
                  Google
                </Button>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground w-full text-center">
                  Don&apos;t have an account? <Link href="/signup" className="text-primary hover:underline font-medium">Sign up</Link>
                </p>
              </CardFooter>
            </Card>
          ) : (
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
                    onKeyDown={(e) => e.key === "Enter" && handleMemberLogin()}
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
                    <Key className="h-4 w-4 text-muted-foreground" /> Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showMemberPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={memberPassword}
                      onChange={(e) => setMemberPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleMemberLogin()}
                      className="h-11 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMemberPassword(!showMemberPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showMemberPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  className="w-full h-11 font-semibold bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={handleMemberLogin}
                  disabled={isLoading || !memberId || !memberPassword}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Crown className="h-4 w-4 mr-2" />}
                  {isLoading ? "Signing in..." : "Sign In as Member"}
                </Button>
                <p className="text-xs text-muted-foreground text-center pt-2">
                  Don&apos;t have a member ID?{" "}
                  <a href="/contact" className="text-primary underline hover:no-underline">Contact RIC</a> to become a member.
                </p>
              </CardContent>
            </Card>
          )}

          {(loginMode === "member") && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              Are you a website user?{" "}
              <button type="button" onClick={() => setLoginMode("website")} className="text-primary underline hover:no-underline font-medium">
                Sign in with email
              </button>
            </p>
          )}
        </div>
      </div>
      {/* Right side - Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/10 via-primary/5 to-background items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="relative text-center max-w-md px-8">
          <div className={`h-20 w-20 rounded-2xl mx-auto mb-6 flex items-center justify-center transition-colors ${
            loginMode === "member" ? "bg-amber-500/10" : "bg-primary/10"
          }`}>
            {loginMode === "member" ? (
              <Crown className="h-10 w-10 text-amber-600" />
            ) : (
              <Lock className="h-10 w-10 text-primary" />
            )}
          </div>
          <h2 className="text-2xl font-bold mb-3">
            {loginMode === "member" ? "RIC Member Portal" : "Secure Access"}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {loginMode === "member"
              ? "Access exclusive member benefits, book free seats for events, and manage your membership."
              : "Sign in to manage your bookings, view event history, and access exclusive member benefits."}
          </p>
          <div className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground">
            <ArrowRight className="h-4 w-4" />
            <span>Explore events, book seats, and more</span>
          </div>
          {loginMode === "member" && (
            <div className="flex items-center gap-4 mt-6 justify-center">
              {[
                { icon: Crown, text: "Free seats" },
                { icon: ArrowRight, text: "Quick booking" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <item.icon className="h-4 w-4 text-amber-500" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
