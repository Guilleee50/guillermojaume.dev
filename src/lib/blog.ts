import { getCollection } from 'astro:content';
import type { Lang } from '../i18n/content';

/** Posts publicados (los borradores solo se ven en `astro dev`), del más reciente al más antiguo. */
export async function getPosts(lang?: Lang) {
  const posts = await getCollection('blog', ({ data }) =>
    (import.meta.env.DEV || !data.draft) && (!lang || data.lang === lang),
  );
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function formatDate(date: Date, locale: string) {
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}
