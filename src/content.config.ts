import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      /** Portada: ruta relativa al .md, p. ej. ../../assets/blog/mi-post.png (ideal 1200x630) */
      image: image(),
      imageAlt: z.string(),
      tags: z.array(z.string()).default([]),
      lang: z.enum(['es', 'en']).default('es'),
      draft: z.boolean().default(false),
    }),
});

export const collections = { blog };
