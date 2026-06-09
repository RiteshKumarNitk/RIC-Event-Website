import Link from "next/link";
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, Clock, Shield, ArrowRight, Crown } from "lucide-react";

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
    <footer className="bg-zinc-950 text-zinc-300 border-t border-zinc-800">
      <div className="container py-16">
        {/* Top CTA */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mb-12 text-center">
          <Crown className="h-8 w-8 text-amber-500 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-white mb-2">Become an RIC Member</h3>
          <p className="text-zinc-400 text-sm max-w-md mx-auto mb-4">
            Enjoy exclusive access to member-only seats, free events, and special privileges all year round.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            Learn about membership <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand & Mission */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="h-9 w-9 rounded-lg bg-amber-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">RIC</span>
              </div>
              <span className="font-bold text-lg text-white">RIC Jaipur</span>
            </Link>
            <p className="text-sm text-zinc-400 leading-relaxed mb-4">
              The Rajasthan International Centre is a premier cultural institution in Jaipur, dedicated to
              fostering cultural exchange, intellectual dialogue, and community engagement through world-class
              events, performances, and conferences.
            </p>
            <div className="flex gap-3">
              <span className="h-9 w-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 cursor-not-allowed" title="Coming soon">
                <Facebook className="h-4 w-4" />
              </span>
              <span className="h-9 w-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 cursor-not-allowed" title="Coming soon">
                <Twitter className="h-4 w-4" />
              </span>
              <span className="h-9 w-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 cursor-not-allowed" title="Coming soon">
                <Instagram className="h-4 w-4" />
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {navLinks.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-zinc-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Events */}
          <div>
            <h4 className="font-semibold text-white mb-4">Events</h4>
            <ul className="space-y-2.5">
              {eventLinks.map((link, i) => (
                <li key={i}>
                  <Link href={link.href} className="text-sm text-zinc-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-zinc-400">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                <span>Jhalana Institutional Area, Jhalana Doongri, Jaipur, Rajasthan 302004</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-zinc-400">
                <Phone className="h-4 w-4 shrink-0 text-amber-500" />
                <span>+91-141-1234567</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-zinc-400">
                <Mail className="h-4 w-4 shrink-0 text-amber-500" />
                <span>contact@ricjaipur.in</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-zinc-400">
                <Clock className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                <span>Mon–Sat: 10:00 AM – 8:00 PM<br />Sun: Closed (Event days open)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-zinc-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-zinc-500">
            &copy; {new Date().getFullYear()} Rajasthan International Centre. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-zinc-500">
            <Link href="/about" className="hover:text-zinc-300 transition-colors">Privacy Policy</Link>
            <Link href="/about" className="hover:text-zinc-300 transition-colors">Terms of Service</Link>
            <Link href="/contact" className="hover:text-zinc-300 transition-colors">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
