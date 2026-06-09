import Image from 'next/image';
import Link from 'next/link';
import { Building, Globe, Target, MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AboutPage() {
  const stats = [
    { label: "Events Per Year", value: "100+" },
    { label: "Annual Visitors", value: "50K+" },
    { label: "Artists Featured", value: "200+" },
    { label: "Countries Represented", value: "30+" },
  ];

  const venues = [
    { name: "Main Auditorium", capacity: "1,200 seats", desc: "State-of-the-art acoustics for performances and conferences", img: "venue-auditorium" },
    { name: "Conference Hall A", capacity: "300 seats", desc: "Flexible space for seminars and workshops", img: "venue-conference" },
    { name: "Art Gallery", capacity: "500 visitors", desc: "Modern exhibition space for local and international artists", img: "venue-gallery" },
    { name: "Digital Library", capacity: "100 seats", desc: "Extensive collection of rare manuscripts and digital resources", img: "venue-library" },
  ];

  return (
    <div className="bg-background">
      <section className="relative h-[40vh] min-h-[300px] bg-muted/50">
        <Image
          src="https://picsum.photos/seed/ric-about-hero/1800/600"
          alt="Rajasthan International Center"
          fill
          className="object-cover"
          data-ai-hint="modern building exterior"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="container relative h-full flex flex-col items-center justify-center text-center px-4 -mt-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">About RIC</h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-xl">A Hub of Culture, Knowledge, and Diplomacy</p>
        </div>
      </section>

      <div className="container mx-auto max-w-7xl px-4 py-16">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
          <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-lg">
            <Image
              src="https://picsum.photos/seed/ric-about/800/600"
              alt="Rajasthan International Center"
              fill
              className="object-cover"
              data-ai-hint="modern building exterior"
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-4">Where Culture Meets Innovation</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                The Rajasthan International Centre (RIC) stands as a premier institution in Jaipur, conceived to foster cultural exchange, intellectual dialogue, and social engagement.
              </p>
              <p>
                It is a space where art, culture, and intellect converge, offering a platform for thinkers, artists, and leaders from around the globe to connect and collaborate.
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, i) => (
            <Card key={i} className="text-center">
              <CardContent className="pt-6">
                <p className="text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Venues</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">World-class spaces designed for every type of event</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {venues.map((venue, i) => (
              <Card key={i} className="overflow-hidden group">
                <div className="grid grid-cols-1 md:grid-cols-5 h-full">
                  <div className="relative h-48 md:h-auto md:col-span-2 overflow-hidden">
                    <Image
                      src={`https://picsum.photos/seed/${venue.img}/400/300`}
                      alt={venue.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      data-ai-hint="venue interior"
                    />
                  </div>
                  <div className="p-6 md:col-span-3 flex flex-col justify-center">
                    <CardTitle className="text-lg">{venue.name}</CardTitle>
                    <p className="text-sm text-primary font-medium mt-1">{venue.capacity}</p>
                    <p className="text-sm text-muted-foreground mt-2">{venue.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {[
            { icon: Target, title: "Our Mission", desc: "To promote intellectual and cultural activities, providing a world-class platform for dialogue and diplomacy that bridges Rajasthan with the world." },
            { icon: Building, title: "Our Facilities", desc: "State-of-the-art auditoriums, convention halls, a digital library, and art galleries designed to host a wide spectrum of events." },
            { icon: Globe, title: "Our Vision", desc: "To be a globally recognized center of excellence that showcases the rich heritage of Rajasthan while embracing modern innovation and thought." },
          ].map((item, i) => (
            <div key={i} className="text-center p-8 rounded-2xl bg-card border hover:shadow-lg transition-shadow">
              <item.icon className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </section>

        <section className="mb-8">
          <Card>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-2xl font-bold mb-6">Visit Us</h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">Address</p>
                        <p className="text-sm text-muted-foreground">Jhalana Institutional Area, Jhalana Doongri, Jaipur, Rajasthan 302004</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">Phone</p>
                        <p className="text-sm text-muted-foreground">+91 141 XXX XXXX</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">info@ricjaipur.org</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">Hours</p>
                        <p className="text-sm text-muted-foreground">Mon-Sat: 9:00 AM - 8:00 PM</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button asChild><Link href="/contact">Contact Us</Link></Button>
                  </div>
                </div>
                <div className="relative h-64 md:h-auto rounded-xl overflow-hidden">
                  <Image
                    src="https://picsum.photos/seed/ric-map/800/500"
                    alt="Map location"
                    fill
                    className="object-cover"
                    data-ai-hint="city map location"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
