"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Crown, ArrowLeft, CheckCircle2, Loader2, User, Phone, IdCard } from "lucide-react"
import { linkMemberToUser, getLinkedMember } from "@/app/actions/member-link-actions"
import { Badge } from "@/components/ui/badge"

export default function MemberLoginPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const { toast } = useToast();

  const [memberId, setMemberId] = useState("");
  const [phone, setPhone] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkedMember, setLinkedMember] = useState<any>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      if (!user) { setChecking(false); return; }
      const uid = (user as any).uid || (user as any).id;
      const res = await getLinkedMember(uid);
      if (res.success && res.member) {
        setLinkedMember(res.member);
      }
      setChecking(false);
    };
    if (!authLoading) check();
  }, [user, authLoading]);

  const handleLink = async () => {
    if (!user || !memberId || !phone) return;
    setLinking(true);
    const uid = (user as any).uid || (user as any).id;
    const res = await linkMemberToUser(uid, parseInt(memberId), phone);
    if (res.success) {
      toast({ title: "Member Linked", description: `Welcome, ${res.member?.name}!` });
      setLinkedMember(res.member);
      if (redirect) {
        router.push(redirect);
      }
    } else {
      toast({ variant: "destructive", title: "Link Failed", description: res.error || "Could not verify member details." });
    }
    setLinking(false);
  };

  if (authLoading || checking) {
    return (
      <div className="container flex min-h-screen items-center justify-center py-12 px-4">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container flex min-h-screen items-center justify-center py-12 px-4">
        <div className="w-full max-w-sm text-center">
          <Crown className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">RIC Member Login</h1>
          <p className="text-muted-foreground mb-6">You need to be signed in to link your RIC membership.</p>
          <Button asChild className="w-full">
            <Link href={`/login?redirect=/member-login${redirect ? `?redirect=${redirect}` : ""}`}>Sign In First</Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Don&apos;t have an account? <Link href="/signup" className="text-primary hover:underline font-medium">Sign up</Link>
          </p>
        </div>
      </div>
    );
  }

  if (linkedMember) {
    return (
      <div className="container flex min-h-screen items-center justify-center py-12 px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="mx-auto bg-amber-100 rounded-full h-16 w-16 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold">Member Linked</h1>
            <p className="text-muted-foreground mt-1">Your RIC membership is connected.</p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <Crown className="h-8 w-8 text-amber-500 mx-auto" />
                <p className="text-xl font-bold">{linkedMember.name}</p>
                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                  Member ID: {linkedMember.memberId}
                </Badge>
                {linkedMember.categoryAcronym && (
                  <p className="text-sm text-muted-foreground">{linkedMember.categoryAcronym}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button className="w-full" onClick={() => router.push(redirect || "/account")}>
                {redirect ? "Continue to Booking" : "Go to My Account"}
              </Button>
              {redirect && (
                <Button variant="ghost" className="w-full" onClick={() => router.push("/account")}>
                  Go to My Account
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container flex min-h-screen items-center justify-center py-12 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto bg-amber-100 rounded-full h-16 w-16 flex items-center justify-center mb-4">
            <Crown className="h-10 w-10 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold">Link RIC Membership</h1>
          <p className="text-muted-foreground mt-1">Enter your member details to unlock exclusive benefits.</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
              <p className="text-xs font-medium text-amber-700">
                Signed in as <span className="font-bold">{user.email}</span>
              </p>
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
                <IdCard className="h-4 w-4 text-muted-foreground" /> Member ID
              </label>
              <Input
                placeholder="e.g. 13"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
                <Phone className="h-4 w-4 text-muted-foreground" /> Registered Phone Number
              </label>
              <Input
                placeholder="Phone number on record"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <Button
              className="w-full bg-amber-600 hover:bg-amber-700"
              onClick={handleLink}
              disabled={linking || !memberId || !phone}
            >
              {linking ? "Verifying..." : "Link Member Account"}
            </Button>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <p className="text-xs text-muted-foreground text-center">
              Don&apos;t have a member ID?{" "}
              <a href="/contact" className="text-primary underline">Contact RIC</a> to become a member.
            </p>
            {redirect && (
              <Button variant="ghost" size="sm" className="w-full gap-1" onClick={() => router.push(redirect)}>
                <ArrowLeft className="h-4 w-4" /> Skip, go back
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
