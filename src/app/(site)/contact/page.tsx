"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  subject: z.string().min(5, 'Subject must be at least 5 characters.'),
  message: z.string().min(10, 'Message must be at least 10 characters.'),
});

export default function ContactPage() {
    const { toast } = useToast();

    const form = useForm<z.infer<typeof contactSchema>>({
        resolver: zodResolver(contactSchema),
        defaultValues: { name: '', email: '', subject: '', message: '' },
    });

    function onSubmit(values: z.infer<typeof contactSchema>) {
        toast({ title: "Message Sent!", description: "We'll get back to you shortly." });
        form.reset();
    }

    return (
        <div className="bg-background">
          <section className="relative h-[30vh] min-h-[220px] bg-muted/50">
            <Image src="https://picsum.photos/seed/contact-hero/1800/600" alt="Contact" fill className="object-cover" data-ai-hint="customer service phone" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            <div className="container relative h-full flex flex-col items-center justify-center text-center px-4 -mt-4">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Get in Touch</h1>
              <p className="mt-3 text-lg text-muted-foreground">We'd love to hear from you</p>
            </div>
          </section>

          <div className="container mx-auto max-w-6xl px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {[
                { icon: MapPin, title: "Visit Us", info: "Jhalana Institutional Area, Jaipur, Rajasthan 302004" },
                { icon: Phone, title: "Call Us", info: "+91-141-1234567" },
                { icon: Mail, title: "Email Us", info: "contact@ricjaipur.in" },
              ].map((item, i) => (
                <Card key={i} className="text-center">
                  <CardContent className="pt-6">
                    <item.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{item.info}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              <div className="md:col-span-3">
                <Card>
                  <CardHeader><CardTitle>Send us a Message</CardTitle></CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} placeholder="John Doe" /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} placeholder="you@example.com" /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                        <FormField control={form.control} name="subject" render={({ field }) => (
                          <FormItem><FormLabel>Subject</FormLabel><FormControl><Input {...field} placeholder="Event inquiry" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="message" render={({ field }) => (
                          <FormItem><FormLabel>Message</FormLabel><FormControl><Textarea {...field} placeholder="Tell us how we can help..." rows={5} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <Button type="submit" className="w-full"><Send className="mr-2 h-4 w-4" /> Send Message</Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>
              <div className="md:col-span-2">
                <Card>
                  <CardHeader><CardTitle>Office Hours</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { day: "Monday - Friday", hours: "9:00 AM - 8:00 PM" },
                        { day: "Saturday", hours: "10:00 AM - 6:00 PM" },
                        { day: "Sunday", hours: "10:00 AM - 4:00 PM" },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                          <span className="text-sm font-medium">{item.day}</span>
                          <span className="text-sm text-muted-foreground">{item.hours}</span>
                        </div>
                      ))}
                    </div>
                    <div className="relative h-48 mt-6 rounded-lg overflow-hidden">
                      <Image src="https://picsum.photos/seed/ric-map/600/400" alt="Map" fill className="object-cover" data-ai-hint="city map location" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><Clock className="h-3 w-3" /> Holiday hours may vary</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
    );
}
