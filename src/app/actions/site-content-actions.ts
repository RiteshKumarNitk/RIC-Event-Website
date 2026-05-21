"use server";

import { prisma } from "@/lib/prisma";

export type SiteContentSection = {
  id: string;
  section: string;
  title: string | null;
  subtitle: string | null;
  content: any;
};

export async function getSiteContent() {
  try {
    const all = await prisma.siteContent.findMany();
    const map: Record<string, SiteContentSection> = {};
    for (const item of all) {
      map[item.section] = {
        id: item.id,
        section: item.section,
        title: item.title,
        subtitle: item.subtitle,
        content: item.content,
      };
    }
    return { success: true, data: map };
  } catch {
    return { success: false, data: {} };
  }
}

export async function upsertSiteContent(
  section: string,
  data: { title?: string; subtitle?: string; content?: any }
) {
  try {
    const existing = await prisma.siteContent.findUnique({ where: { section } });
    if (existing) {
      await prisma.siteContent.update({
        where: { section },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.subtitle !== undefined && { subtitle: data.subtitle }),
          ...(data.content !== undefined && { content: data.content }),
        },
      });
    } else {
      await prisma.siteContent.create({
        data: {
          section,
          title: data.title ?? null,
          subtitle: data.subtitle ?? null,
          content: data.content ?? {},
        },
      });
    }
    return { success: true };
  } catch (error) {
    console.error("Error upserting site content:", error);
    return { success: false, error: "Failed to save content" };
  }
}
