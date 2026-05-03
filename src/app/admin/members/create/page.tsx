
"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMembers } from "../members-provider";
import { format } from 'date-fns';

const memberSchema = z.object({
  memberId: z.coerce.number().int("Member ID must be an integer."),
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(10, "Phone number must be at least 10 digits."),
  address: z.string().min(5, "Address is required."),
  dob: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  doa: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  emergencyContact: z.string().min(10, "Emergency contact must be at least 10 digits."),
  applicationId: z.coerce.number().int().optional(),
  categoryType: z.string().optional(),
  categoryAcronym: z.string().optional(),
});

export default function CreateMemberPage() {
    const router = useRouter();
    const { addMember } = useMembers();

    const form = useForm<z.infer<typeof memberSchema>>({
        resolver: zodResolver(memberSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            address: "",
            dob: format(new Date(), 'yyyy-MM-dd'),
            doa: format(new Date(), 'yyyy-MM-dd'),
            emergencyContact: "",
            categoryType: "IND",
            categoryAcronym: "FM",
        },
    });

    async function onSubmit(values: z.infer<typeof memberSchema>) {
        await addMember({
            ...values,
            applicationId: values.applicationId ?? 0,
            categoryType: values.categoryType ?? 'IND',
            categoryAcronym: values.categoryAcronym ?? 'IND',
        });
        router.push("/admin/members");
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
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>Add New Member</CardTitle>
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
                                <Button type="submit">Create Member</Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
