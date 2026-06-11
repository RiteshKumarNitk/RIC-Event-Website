import Link from "next/link";
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, Clock, Shield, ArrowRight, Crown } from "lucide-react";
import Image from "next/image";

export function SiteFooter() {
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/events", label: "Events" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
    { href: "/member-login", label: "Member Login" },
  ];

  const eventLinks = [
    { href: "/events", label: "Upcoming Events" },
    { href: "/events", label: "Categories" },
    { href: "/about", label: "Venues & Spaces" },
  ];

  return (
    <footer className="bg-slate-50 text-slate-600 border-t border-slate-200">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand & Mission */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4 group">
              <Image src="/ric-logo.png" alt="RIC Logo" width={36} height={36} className="object-contain group-hover:scale-105 transition-transform" />
              <span className="font-bold text-lg text-slate-900">RIC Jaipur</span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              The Rajasthan International Centre is a premier cultural institution in Jaipur, dedicated to
              fostering cultural exchange, intellectual dialogue, and community engagement through world-class
              events, performances, and conferences.
            </p>
            <div className="flex gap-3">
              <span className="h-9 w-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-slate-50 transition-colors cursor-not-allowed" title="Coming soon">
                <Facebook className="h-4 w-4" />
              </span>
              <span className="h-9 w-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-slate-50 transition-colors cursor-not-allowed" title="Coming soon">
                <Twitter className="h-4 w-4" />
              </span>
              <span className="h-9 w-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-slate-50 transition-colors cursor-not-allowed" title="Coming soon">
                <Instagram className="h-4 w-4" />
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-5">Quick Links</h4>
            <ul className="space-y-3">
              {navLinks.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-500 hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Events */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-5">Events</h4>
            <ul className="space-y-3">
              {eventLinks.map((link, i) => (
                <li key={i}>
                  <Link href={link.href} className="text-sm text-slate-500 hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-5">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-slate-500">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                <span className="leading-relaxed">Jhalana Institutional Area, Jhalana Doongri, Jaipur, Rajasthan 302004</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-500 hover:text-slate-900 transition-colors">
                <Phone className="h-4 w-4 shrink-0 text-amber-500" />
                <span>+91-141-1234567</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-500 hover:text-slate-900 transition-colors">
                <Mail className="h-4 w-4 shrink-0 text-amber-500" />
                <span>contact@ricjaipur.in</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-500">
                <Clock className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                <span className="leading-relaxed">Mon–Sat: 10:00 AM – 8:00 PM<br />Sun: Closed (Event days open)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-200 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Rajasthan International Centre. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
            <Link href="/about" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
            <Link href="/about" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
            <Link href="/contact" className="hover:text-slate-900 transition-colors">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
