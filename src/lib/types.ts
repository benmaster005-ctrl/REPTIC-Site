export type NewsItem = {
  slug: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  coverUrl: string | null;
  category: string | null;
  publishedAt: string;
};

export type EventItem = {
  slug: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  coverUrl: string | null;
  category: string | null;
  startsAt: string;
  endsAt: string | null;
  locationName: string | null;
  city: string | null;
  registrationEnabled: boolean;
};

export type Page = {
  slug: string;
  title: string;
  summary: string | null;
  body: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type GovernanceMember = {
  id: string;
  fullName: string;
  positionTitle: string;
  organization: string | null;
  photoUrl: string | null;
  bio: string | null;
};

export type Category = { slug: string; name: string; description: string | null };
export type KeyFigure = { label: string; value: string };

export type SiteContact = { address: string; phone: string; email: string; hours?: string; dpo?: string };
export type SiteSocial = { facebook?: string; twitter?: string; linkedin?: string };
