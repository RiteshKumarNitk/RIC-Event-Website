"use client";

import { useMemberAuth } from "@/hooks/use-member-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Crown, User, Phone, Mail, Calendar, MapPin, IdCard, LogOut, Tag, Shield } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

function MemberSkeleton() {
  return (
    <div className="container max-w-3xl mx-auto px-4 py-12 space-y-6">
      <Skeleton className="h-10 w-64" />
      <Card>
        <CardContent className="pt-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-4 w-40" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function MemberDashboardPage() {
  const { member, loading, memberLogout } = useMemberAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !member) {
      router.push("/member-login");
    }
  }, [member, loading, router]);

  if (loading) return <MemberSkeleton />;
  if (!member) return null;

  return (
    <div className="container max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Crown className="h-8 w-8 text-amber-500" />
          <div>
            <h1 className="text-3xl font-bold">Member Dashboard</h1>
            <p className="text-muted-foreground text-sm">Welcome back, {member.name}</p>
          </div>
        </div>
        <Button variant="outline" onClick={memberLogout} className="gap-2">
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <Crown className="h-10 w-10 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold">{member.name}</h2>
              <p className="text-sm text-muted-foreground">Member ID: {member.memberId}</p>
              <div className="flex items-center gap-1 mt-2">
                <Tag className="h-3 w-3 text-amber-500" />
                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  {member.categoryAcronym || member.categoryType}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <IdCard className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Member ID</p>
                    <p className="font-medium">{member.memberId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Tag className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Category</p>
                    <p className="font-medium">{member.categoryType} ({member.categoryAcronym})</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium">{member.phone}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
