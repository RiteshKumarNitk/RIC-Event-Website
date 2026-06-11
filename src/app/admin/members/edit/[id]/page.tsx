
"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Key, CheckCircle2, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMembers } from "../../members-provider";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const memberSchema = z.object({
  memberId: z.coerce.number().int("Member ID must be an integer."),
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(10, "Phone number must be at least 10 digits."),
  address: z.string().min(5, "Address is required."),
  dob: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  doa: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  emergencyContact: z.string().min(10, "Emergency contact must be at least 10 digits."),
  categoryType: z.string().optional(),
  categoryAcronym: z.string().optional(),
});

export default function EditMemberPage() {
    const router = useRouter();
    const params = useParams();
    const { members, updateMember, loading } = useMembers();
    const { toast } = useToast();
    const memberId = params.id as string;

    const member = members.find(m => m.id === memberId);

    const [resetPassword, setResetPassword] = useState("");
    const [showResetField, setShowResetField] = useState(false);
    const [resetting, setResetting] = useState(false);

    const form = useForm<z.infer<typeof memberSchema>>({
        resolver: zodResolver(memberSchema),
    });

    useEffect(() => {
        if (member) {
            form.reset({
                ...member,
                dob: format(new Date(member.dob), "yyyy-MM-dd"),
                doa: format(new Date(member.doa), "yyyy-MM-dd"),
            });
        }
    }, [member, form]);

    async function onSubmit(values: z.infer<typeof memberSchema>) {
        if (!member) return;
        try {
            await updateMember(member.id, values as any);
            router.push("/admin/members");
        } catch (error) {
            console.error("Form submission failed:", error);
        }
    }

    const handleResetPassword = async () => {
        if (!member || resetPassword.length < 8) return;
        setResetting(true);
        try {
            const res = await fetch("/api/auth/member-reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ memberId: member.memberId, newPassword: resetPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                toast({ title: "Password Reset", description: `New password set for ${member.name}` });
                setResetPassword("");
                setShowResetField(false);
            } else {
                toast({ variant: "destructive", title: "Error", description: data.error || "Failed to reset password" });
            }
        } catch {
            toast({ variant: "destructive", title: "Error", description: "Failed to reset password" });
        }
        setResetting(false);
    };

    if (loading) {
        return <div>Loading member details...</div>
    }

    if (!member) {
        return (
            <div>
                <h1 className="text-2xl font-bold">Member not found</h1>
                <p>Loading or member does not exist...</p>
                <Button asChild variant="link">
                    <Link href="/admin/members">Go back</Link>
                </Button>
            </div>
        )
    }

    return (
        <div>
            <div className="mb-8">
                <Button asChild variant="outline">
                    <Link href="/admin/members">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Members
                    </Link>
                </Button>
            </div>
            <div className="max-w-4xl mx-auto space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Member</CardTitle>
                        <CardDescription>{member.name} — ID: {member.memberId}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField control={form.control} name="memberId" render={({ field }) => (
                                        <FormItem><FormLabel>Member ID</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField control={form.control} name="email" render={({ field }) => (
                                        <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="phone" render={({ field }) => (
                                        <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <FormField control={form.control} name="address" render={({ field }) => (
                                    <FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <FormField control={form.control} name="dob" render={({ field }) => (
                                        <FormItem><FormLabel>Date of Birth</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="doa" render={({ field }) => (
                                        <FormItem><FormLabel>Date of Association</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="emergencyContact" render={({ field }) => (
                                        <FormItem><FormLabel>Emergency Contact</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit">Save Changes</Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                {/* Password Reset Card */}
                <Card className="border-amber-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2"><Key className="h-4 w-4 text-amber-600" /> Password</CardTitle>
                        <CardDescription>Reset the member's login password</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!showResetField ? (
                            <Button variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => setShowResetField(true)}>
                                <Key className="mr-2 h-4 w-4" /> Reset Password
                            </Button>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <Input
                                        type="text"
                                        placeholder="Enter new password (min 8 chars)"
                                        value={resetPassword}
                                        onChange={(e) => setResetPassword(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button onClick={handleResetPassword} disabled={resetting || resetPassword.length < 8}>
                                        {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                        {resetting ? "Saving..." : "Save"}
                                    </Button>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => { setShowResetField(false); setResetPassword(""); }}>
                                    Cancel
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
