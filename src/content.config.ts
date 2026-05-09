import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const linkSchema = z.object({
  label: z.string(),
  url: z.string().url()
});

const profile = defineCollection({
  loader: glob({ base: "./src/content/profile", pattern: "**/*.{json,yaml,yml}" }),
  schema: z.object({
    name: z.string(),
    role: z.string().optional(),
    avatar: z.string().optional(),
    bio: z.string(),
    location: z.string().optional(),
    email: z.string().email().optional(),
    links: z.array(linkSchema).default([])
  })
});

const works = defineCollection({
  loader: glob({ base: "./src/content/works", pattern: "**/*.{json,yaml,yml}" }),
  schema: z.object({
    title: z.string(),
    category: z.enum(["web", "design", "code", "writing", "unity", "other"]).default("other"),
    summary: z.string(),
    detail: z.string(),
    cover: z.string().optional(),
    thumbnail: z.string().optional(),
    videoUrl: z.string().url().optional(),
    tags: z.array(z.string()).default([]),
    links: z.array(linkSchema).default([]),
    featured: z.boolean().default(false),
    order: z.number().default(999)
  })
});

const notes = defineCollection({
  loader: glob({ base: "./src/content/notes", pattern: "**/*.{json,yaml,yml}" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    content: z.string(),
    tags: z.array(z.string()).default([]),
    order: z.number().default(999)
  })
});

export const collections = { profile, works, notes };
