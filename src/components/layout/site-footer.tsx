import Link from "next/link";
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";

export function SiteFooter() {
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/events", label: "Events" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  const adminLinks = [
    { href: "/admin", label: "Admin Dashboard" },
    { href: "/admin/events", label: "Manage Events" },
    { href: "/admin/members", label: "Manage Members" },
    { href: "/admin/users", label: "Manage Users" },
  ];

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">RIC</span>
              </div>
              <span className="font-bold text-lg">RIC Jaipur</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">Jhalana Institutional Area, Jhalana Doongri, Jaipur, Rajasthan 302004</p>
            <div className="flex gap-3">
              <Link href="#" className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Facebook className="h-4 w-4" />
              </Link>
              <Link href="#" className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Twitter className="h-4 w-4" />
              </Link>
              <Link href="#" className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Instagram className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {navLinks.map(link => (
                <li key={link.href}><Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Admin</h4>
            <ul className="space-y-2">
              {adminLinks.map(link => (
                <li key={link.href}><Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 mt-0.5 shrink-0" /> +91-141-1234567
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 mt-0.5 shrink-0" /> contact@ricjaipur.in
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" /> Jhalana Doongri, Jaipur
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Rajasthan International Center. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
