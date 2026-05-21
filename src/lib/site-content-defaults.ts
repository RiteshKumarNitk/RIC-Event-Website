export type SiteContentSection = {
  id: string;
  section: string;
  title: string | null;
  subtitle: string | null;
  content: any;
};

export const DEFAULT_SITE_CONTENT: Record<string, { title: string | null; subtitle: string | null; content: any }> = {
  hero: {
    title: "Rajasthan International Center",
    subtitle: "Where culture, knowledge, and community converge in the heart of Jaipur",
    content: {
      badge: "Premier Cultural Destination",
      image: "https://picsum.photos/seed/ric-hero/1800/1200",
      buttons: [
        { label: "Explore Events", href: "/events", variant: "default" },
        { label: "Learn More", href: "/about", variant: "outline" },
      ],
    },
  },
  stats: {
    title: null,
    subtitle: null,
    content: {
      items: [
        { number: "500+", label: "Events Hosted", icon: "Calendar" },
        { number: "50K+", label: "Visitors Yearly", icon: "Users" },
        { number: "200+", label: "Artists Featured", icon: "Music" },
        { number: "15+", label: "Awards Won", icon: "Award" },
      ],
    },
  },
  about: {
    title: "A Hub of Culture, Knowledge & Diplomacy",
    subtitle: "The Rajasthan International Centre is a world-class institution designed to be the epicenter of cultural exchange, intellectual dialogue, and social engagement in Rajasthan.",
    content: {
      badge: "About RIC",
      features: [
        {
          title: "Culture & Arts",
          description: "Immerse yourself in diverse cultural performances, art exhibitions, and film screenings showcasing local and global talent.",
          icon: "Clapperboard",
        },
        {
          title: "Knowledge & Ideas",
          description: "Engage in thought-provoking seminars, talks, and conferences featuring leading experts from various fields.",
          icon: "Lightbulb",
        },
        {
          title: "Community & Networking",
          description: "Connect with like-minded individuals and professionals in a dynamic environment built for collaboration.",
          icon: "Users",
        },
      ],
    },
  },
  venues: {
    title: "Explore Our Spaces",
    subtitle: null,
    content: {
      badge: "Venues",
      items: [
        {
          title: "Main Auditorium",
          description: "State-of-the-art acoustics and seating for large-scale performances",
          image: "venue1",
          hint: "modern auditorium interior",
        },
        {
          title: "Conference Halls",
          description: "Flexible spaces equipped with the latest technology for meetings",
          image: "venue2",
          hint: "conference room empty",
        },
        {
          title: "Art Gallery",
          description: "A modern space to exhibit art from local and international artists",
          image: "venue3",
          hint: "art gallery empty",
        },
      ],
    },
  },
  cta: {
    title: "Visit Us",
    subtitle: "Jhalana Institutional Area, Jhalana Doongri, Jaipur, Rajasthan 302004",
    content: {
      buttonLabel: "Get Directions",
      buttonHref: "/contact",
    },
  },
};
