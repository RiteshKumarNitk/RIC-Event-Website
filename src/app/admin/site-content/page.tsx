"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  getSiteContent,
  upsertSiteContent,
  type SiteContentSection,
} from "@/app/actions/site-content-actions";
import { DEFAULT_SITE_CONTENT } from "@/lib/site-content-defaults";
import { Loader2, Save, Eye, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

type IconName = "Calendar" | "Users" | "Music" | "Award" | "Clapperboard" | "Lightbulb";

const ICON_OPTIONS: { value: IconName; label: string }[] = [
  { value: "Calendar", label: "Calendar" },
  { value: "Users", label: "Users" },
  { value: "Music", label: "Music" },
  { value: "Award", label: "Award" },
  { value: "Clapperboard", label: "Clapperboard" },
  { value: "Lightbulb", label: "Lightbulb" },
];

export default function SiteContentPage() {
  const [content, setContent] = useState<Record<string, SiteContentSection>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("hero");

  const fetchContent = async () => {
    setLoading(true);
    const res = await getSiteContent();
    if (res.success) {
      setContent(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const getValue = (section: string, field: string, defaultValue?: any) => {
    const sectionData = content[section];
    if (field === "title") return sectionData?.title ?? defaultValue;
    if (field === "subtitle") return sectionData?.subtitle ?? defaultValue;
    return sectionData?.content ?? defaultValue;
  };

  const handleSave = async (section: string) => {
    setSaving(section);
    const sectionData = content[section];
    const res = await upsertSiteContent(section, {
      title: sectionData?.title ?? undefined,
      subtitle: sectionData?.subtitle ?? undefined,
      content: sectionData?.content ?? undefined,
    });
    if (res.success) {
      toast({ title: "Saved", description: `${section} content updated successfully.` });
    } else {
      toast({ variant: "destructive", title: "Error", description: "Failed to save content." });
    }
    setSaving(null);
  };

  const updateField = (section: string, field: string, value: any) => {
    setContent((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const updateContentField = (section: string, field: string, value: any) => {
    setContent((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        content: {
          ...prev[section]?.content,
          [field]: value,
        },
      },
    }));
  };

  const updateContentItem = (section: string, index: number, field: string, value: any) => {
    setContent((prev) => {
      const items = [...(prev[section]?.content?.items || [])];
      items[index] = { ...items[index], [field]: value };
      return {
        ...prev,
        [section]: {
          ...prev[section],
          content: { ...prev[section]?.content, items },
        },
      };
    });
  };

  const addContentItem = (section: string, template: any) => {
    setContent((prev) => {
      const items = [...(prev[section]?.content?.items || []), template];
      return {
        ...prev,
        [section]: {
          ...prev[section],
          content: { ...prev[section]?.content, items },
        },
      };
    });
  };

  const removeContentItem = (section: string, index: number) => {
    setContent((prev) => {
      const items = prev[section]?.content?.items?.filter((_: any, i: number) => i !== index) || [];
      return {
        ...prev,
        [section]: {
          ...prev[section],
          content: { ...prev[section]?.content, items },
        },
      };
    });
  };

  const initSection = (section: string) => {
    if (!content[section]) {
      const defaults = (DEFAULT_SITE_CONTENT as any)[section];
      if (defaults) {
        setContent((prev) => ({
          ...prev,
          [section]: {
            id: "",
            section,
            title: defaults.title,
            subtitle: defaults.subtitle,
            content: defaults.content,
          },
        }));
      }
    }
  };

  useEffect(() => {
    initSection(activeTab);
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Home Page Content</h1>
          <p className="text-muted-foreground mt-1">Manage all dynamic sections of the landing page</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/" target="_blank">
            <Eye className="mr-2 h-4 w-4" /> Preview Site
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="venues">Venues</TabsTrigger>
          <TabsTrigger value="cta">CTA</TabsTrigger>
        </TabsList>

        {/* Hero Tab */}
        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
              <CardDescription>The main banner shown at the top of the home page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={content.hero?.title ?? ""}
                  onChange={(e) => updateField("hero", "title", e.target.value)}
                  placeholder="Rajasthan International Center"
                />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Textarea
                  value={content.hero?.subtitle ?? ""}
                  onChange={(e) => updateField("hero", "subtitle", e.target.value)}
                  placeholder="Where culture, knowledge, and community converge..."
                />
              </div>
              <div>
                <Label>Badge Text</Label>
                <Input
                  value={content.hero?.content?.badge ?? ""}
                  onChange={(e) => updateContentField("hero", "badge", e.target.value)}
                  placeholder="Premier Cultural Destination"
                />
              </div>
              <div>
                <Label>Background Image URL</Label>
                <Input
                  value={content.hero?.content?.image ?? ""}
                  onChange={(e) => updateContentField("hero", "image", e.target.value)}
                  placeholder="https://picsum.photos/seed/ric-hero/1800/1200"
                />
              </div>
              <div className="pt-4 border-t">
                <Label className="mb-2 block">Hero Buttons</Label>
                {content.hero?.content?.buttons?.map((btn: any, i: number) => (
                  <div key={i} className="flex gap-3 mb-2">
                    <Input
                      placeholder="Label"
                      value={btn.label}
                      onChange={(e) => {
                        const buttons = [...(content.hero?.content?.buttons || [])];
                        buttons[i] = { ...buttons[i], label: e.target.value };
                        updateContentField("hero", "buttons", buttons);
                      }}
                    />
                    <Input
                      placeholder="/events"
                      value={btn.href}
                      onChange={(e) => {
                        const buttons = [...(content.hero?.content?.buttons || [])];
                        buttons[i] = { ...buttons[i], href: e.target.value };
                        updateContentField("hero", "buttons", buttons);
                      }}
                    />
                  </div>
                ))}
              </div>
              <Button onClick={() => handleSave("hero")} disabled={saving === "hero"}>
                {saving === "hero" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Hero
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Statistics Section</CardTitle>
              <CardDescription>Numbers and metrics displayed on the home page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {content.stats?.content?.items?.map((item: any, i: number) => (
                <div key={i} className="flex gap-3 items-end p-4 border rounded-lg">
                  <div className="flex-1">
                    <Label>Number</Label>
                    <Input value={item.number} onChange={(e) => updateContentItem("stats", i, "number", e.target.value)} placeholder="500+" />
                  </div>
                  <div className="flex-1">
                    <Label>Label</Label>
                    <Input value={item.label} onChange={(e) => updateContentItem("stats", i, "label", e.target.value)} placeholder="Events Hosted" />
                  </div>
                  <div className="flex-1">
                    <Label>Icon</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={item.icon}
                      onChange={(e) => updateContentItem("stats", i, "icon", e.target.value)}
                    >
                      {ICON_OPTIONS.filter((o) => ["Calendar", "Users", "Music", "Award"].includes(o.value)).map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeContentItem("stats", i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => addContentItem("stats", { number: "100+", label: "New Metric", icon: "Calendar" })}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Stat
              </Button>
              <div className="pt-4">
                <Button onClick={() => handleSave("stats")} disabled={saving === "stats"}>
                  {saving === "stats" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Stats
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>About Section</CardTitle>
              <CardDescription>Information about Rajasthan International Centre</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Section Title</Label>
                <Input
                  value={content.about?.title ?? ""}
                  onChange={(e) => updateField("about", "title", e.target.value)}
                  placeholder="A Hub of Culture, Knowledge & Diplomacy"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={content.about?.subtitle ?? ""}
                  onChange={(e) => updateField("about", "subtitle", e.target.value)}
                  placeholder="Description about RIC..."
                />
              </div>
              <div>
                <Label>Badge Text</Label>
                <Input
                  value={content.about?.content?.badge ?? ""}
                  onChange={(e) => updateContentField("about", "badge", e.target.value)}
                  placeholder="About RIC"
                />
              </div>
              <div className="pt-4 border-t">
                <Label className="mb-2 block">Feature Cards</Label>
                {content.about?.content?.features?.map((feature: any, i: number) => (
                  <div key={i} className="p-4 border rounded-lg mb-3 space-y-3">
                    <div>
                      <Label>Title</Label>
                      <Input value={feature.title} onChange={(e) => {
                        const features = [...(content.about?.content?.features || [])];
                        features[i] = { ...features[i], title: e.target.value };
                        updateContentField("about", "features", features);
                      }} />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea value={feature.description} onChange={(e) => {
                        const features = [...(content.about?.content?.features || [])];
                        features[i] = { ...features[i], description: e.target.value };
                        updateContentField("about", "features", features);
                      }} />
                    </div>
                    <div>
                      <Label>Icon</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={feature.icon}
                        onChange={(e) => {
                          const features = [...(content.about?.content?.features || [])];
                          features[i] = { ...features[i], icon: e.target.value };
                          updateContentField("about", "features", features);
                        }}
                      >
                        {ICON_OPTIONS.filter((o) => ["Clapperboard", "Lightbulb", "Users"].includes(o.value)).map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => {
                      const features = content.about?.content?.features?.filter((_: any, j: number) => j !== i) || [];
                      updateContentField("about", "features", features);
                    }}>
                      <Trash2 className="h-4 w-4 mr-2 text-destructive" /> Remove
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={() => {
                  const features = [...(content.about?.content?.features || []), { title: "New Feature", description: "Description here", icon: "Clapperboard" }];
                  updateContentField("about", "features", features);
                }}>
                  <Plus className="mr-2 h-4 w-4" /> Add Feature
                </Button>
              </div>
              <div className="pt-4">
                <Button onClick={() => handleSave("about")} disabled={saving === "about"}>
                  {saving === "about" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save About
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Venues Tab */}
        <TabsContent value="venues">
          <Card>
            <CardHeader>
              <CardTitle>Venues Section</CardTitle>
              <CardDescription>Spaces showcased on the home page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Section Title</Label>
                <Input
                  value={content.venues?.title ?? ""}
                  onChange={(e) => updateField("venues", "title", e.target.value)}
                  placeholder="Explore Our Spaces"
                />
              </div>
              <div>
                <Label>Badge Text</Label>
                <Input
                  value={content.venues?.content?.badge ?? ""}
                  onChange={(e) => updateContentField("venues", "badge", e.target.value)}
                  placeholder="Venues"
                />
              </div>
              <div className="pt-4 border-t">
                {content.venues?.content?.items?.map((item: any, i: number) => (
                  <div key={i} className="p-4 border rounded-lg mb-3 space-y-3">
                    <div>
                      <Label>Title</Label>
                      <Input value={item.title} onChange={(e) => {
                        const items = [...(content.venues?.content?.items || [])];
                        items[i] = { ...items[i], title: e.target.value };
                        updateContentField("venues", "items", items);
                      }} />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea value={item.description} onChange={(e) => {
                        const items = [...(content.venues?.content?.items || [])];
                        items[i] = { ...items[i], description: e.target.value };
                        updateContentField("venues", "items", items);
                      }} />
                    </div>
                    <div>
                      <Label>Image Seed</Label>
                      <Input value={item.image} onChange={(e) => {
                        const items = [...(content.venues?.content?.items || [])];
                        items[i] = { ...items[i], image: e.target.value };
                        updateContentField("venues", "items", items);
                      }} placeholder="venue1" />
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => {
                      const items = content.venues?.content?.items?.filter((_: any, j: number) => j !== i) || [];
                      updateContentField("venues", "items", items);
                    }}>
                      <Trash2 className="h-4 w-4 mr-2 text-destructive" /> Remove
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={() => {
                  const items = [...(content.venues?.content?.items || []), { title: "New Venue", description: "Description", image: "venue", hint: "" }];
                  updateContentField("venues", "items", items);
                }}>
                  <Plus className="mr-2 h-4 w-4" /> Add Venue
                </Button>
              </div>
              <div className="pt-4">
                <Button onClick={() => handleSave("venues")} disabled={saving === "venues"}>
                  {saving === "venues" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Venues
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CTA Tab */}
        <TabsContent value="cta">
          <Card>
            <CardHeader>
              <CardTitle>CTA / Visit Us Section</CardTitle>
              <CardDescription>Call-to-action section at the bottom of the home page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={content.cta?.title ?? ""}
                  onChange={(e) => updateField("cta", "title", e.target.value)}
                  placeholder="Visit Us"
                />
              </div>
              <div>
                <Label>Address</Label>
                <Textarea
                  value={content.cta?.subtitle ?? ""}
                  onChange={(e) => updateField("cta", "subtitle", e.target.value)}
                  placeholder="Jhalana Institutional Area..."
                />
              </div>
              <div>
                <Label>Button Label</Label>
                <Input
                  value={content.cta?.content?.buttonLabel ?? ""}
                  onChange={(e) => updateContentField("cta", "buttonLabel", e.target.value)}
                  placeholder="Get Directions"
                />
              </div>
              <div>
                <Label>Button Link</Label>
                <Input
                  value={content.cta?.content?.buttonHref ?? ""}
                  onChange={(e) => updateContentField("cta", "buttonHref", e.target.value)}
                  placeholder="/contact"
                />
              </div>
              <div className="pt-4">
                <Button onClick={() => handleSave("cta")} disabled={saving === "cta"}>
                  {saving === "cta" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save CTA
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
