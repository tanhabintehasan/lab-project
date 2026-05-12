export interface CMSSectionItemPoint {
  id: string;
  textZh: string;
  textEn?: string | null;
  sortOrder: number;
  isEnabled: boolean;
}

export interface CMSSectionItem {
  id: string;
  titleZh?: string | null;
  titleEn?: string | null;
  subtitleZh?: string | null;
  subtitleEn?: string | null;
  descriptionZh?: string | null;
  descriptionEn?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  linkLabelZh?: string | null;
  linkLabelEn?: string | null;
  icon?: string | null;
  badgeZh?: string | null;
  badgeEn?: string | null;
  value?: string | null;
  sortOrder: number;
  isEnabled: boolean;
  points?: CMSSectionItemPoint[];
}

export interface CMSSection {
  id: string;
  sectionKey: string;
  name?: string | null;
  titleZh?: string | null;
  titleEn?: string | null;
  subtitleZh?: string | null;
  subtitleEn?: string | null;
  descriptionZh?: string | null;
  descriptionEn?: string | null;
  badgeZh?: string | null;
  badgeEn?: string | null;
  imageUrl?: string | null;
  layoutType?: string | null;
  styleVariant?: string | null;
  isEnabled: boolean;
  isPublished: boolean;
  sortOrder: number;
  items?: CMSSectionItem[];
}

export interface CMSPage {
  id: string;
  slug: string;
  titleZh: string;
  titleEn?: string | null;
  type?: string | null;
  contentZh?: string | null;
  contentEn?: string | null;
  excerpt?: string | null;
  coverImage?: string | null;
  isPublished: boolean;
  sortOrder: number;
  sections?: CMSSection[];
}
