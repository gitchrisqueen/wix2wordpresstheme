/**
 * Type definitions for PageSpec and related structures
 */

import { z } from 'zod';

// Section types
export const SectionTypeSchema = z.enum([
  'header',
  'hero',
  'featureGrid',
  'gallery',
  'testimonial',
  'pricing',
  'faq',
  'cta',
  'contactForm',
  'richText',
  'footer',
  'grid',
  'list',
  'unknown',
]);

export type SectionType = z.infer<typeof SectionTypeSchema>;

// Template hints
export const TemplateHintSchema = z.enum([
  'home',
  'landing',
  'content',
  'contact',
  'blogIndex',
  'generic',
]);

export type TemplateHint = z.infer<typeof TemplateHintSchema>;

// CTA
export const CtaSchema = z.object({
  text: z.string(),
  href: z.string().nullable().optional(),
});

export type Cta = z.infer<typeof CtaSchema>;

// Media
export const MediaSchema = z.object({
  type: z.enum(['image', 'video']),
  src: z.string().nullable().optional(),
  alt: z.string().nullable().optional(),
  localAsset: z.string().nullable().optional(),
});

export type Media = z.infer<typeof MediaSchema>;

// DOM Anchor
export const DomAnchorSchema = z.object({
  strategy: z.enum(['selector', 'path']),
  value: z.string(),
});

export type DomAnchor = z.infer<typeof DomAnchorSchema>;

// Style hints for sections
export const StyleHintsSchema = z.object({
  backgroundColor: z.string().nullable().optional(),
  layout: z.enum(['fullWidth', 'contained']).nullable().optional(),
});

export type StyleHints = z.infer<typeof StyleHintsSchema>;

// Section
export const SectionSchema = z.object({
  id: z.string(),
  type: SectionTypeSchema,
  heading: z.string().nullable().optional(),
  textBlocks: z.array(z.string()).optional().default([]),
  ctas: z.array(CtaSchema).optional().default([]),
  media: z.array(MediaSchema).optional().default([]),
  domAnchor: DomAnchorSchema.optional(),
  forms: z.array(FormSchema).optional().default([]),
  links: z
    .object({
      internal: z.number().int().min(0).optional().default(0),
      external: z.number().int().min(0).optional().default(0),
    })
    .optional(),
  notes: z.array(z.string()).optional().default([]),
  styleHints: StyleHintsSchema.optional(),
  structuralHash: z.string().optional(),
});

export type Section = z.infer<typeof SectionSchema>;

// Form field
export const FormFieldSchema = z.object({
  label: z.string().nullable().optional(),
  type: z.string(),
  required: z.boolean().optional().default(false),
});

export type FormField = z.infer<typeof FormFieldSchema>;

// Form
export const FormSchema = z.object({
  name: z.string().nullable().optional(),
  fields: z.array(FormFieldSchema).optional().default([]),
  submitText: z.string().nullable().optional(),
});

export type Form = z.infer<typeof FormSchema>;

// Meta
export const MetaSchema = z.object({
  title: z.string(),
  description: z.string().nullable().optional(),
  canonical: z.string().nullable().optional(),
  og: z
    .object({
      title: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      image: z.string().nullable().optional(),
      url: z.string().nullable().optional(),
      type: z.string().nullable().optional(),
    })
    .optional(),
});

export type Meta = z.infer<typeof MetaSchema>;

// Links
export const LinksSchema = z.object({
  internal: z.array(z.string()).optional().default([]),
  external: z.array(z.string()).optional().default([]),
});

export type Links = z.infer<typeof LinksSchema>;

// PageSpec
export const PageSpecSchema = z.object({
  version: z.literal('1.0.0'),
  baseUrl: z.string(),
  url: z.string(),
  slug: z.string(),
  templateHint: TemplateHintSchema,
  meta: MetaSchema,
  sections: z.array(SectionSchema),
  links: LinksSchema,
  forms: z.array(FormSchema),
  notes: z.array(z.string()),
});

export type PageSpec = z.infer<typeof PageSpecSchema>;

// Design Tokens
export const ButtonStyleSchema = z.object({
  backgroundColor: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  borderRadius: z.string().nullable().optional(),
  fontWeight: z.string().nullable().optional(),
  padding: z.string().nullable().optional(),
});

export type ButtonStyle = z.infer<typeof ButtonStyleSchema>;

export const DesignTokensSchema = z.object({
  colors: z.object({
    primary: z.string().nullable().optional(),
    secondary: z.string().nullable().optional(),
    background: z.string().nullable().optional(),
    text: z.string().nullable().optional(),
    palette: z.array(z.string()).optional().default([]),
  }),
  typography: z.object({
    fontFamilies: z.array(z.string()).optional().default([]),
    baseFontSizePx: z.number().nullable().optional(),
    headings: z
      .record(
        z.object({
          fontFamily: z.string().nullable().optional(),
          fontSize: z.string().nullable().optional(),
          fontWeight: z.string().nullable().optional(),
        })
      )
      .optional(),
  }),
  components: z.object({
    buttons: z
      .object({
        primary: ButtonStyleSchema.optional(),
        secondary: ButtonStyleSchema.optional(),
      })
      .optional(),
  }),
  sources: z.object({
    pagesAnalyzed: z.number().int().min(0),
    methods: z.array(z.string()),
  }),
});

export type DesignTokens = z.infer<typeof DesignTokensSchema>;

// Layout Pattern
export const PatternStatsSchema = z.object({
  count: z.number().int().min(1),
  headingCount: z.number().int().min(0).optional(),
  textCount: z.number().int().min(0).optional(),
  mediaCount: z.number().int().min(0).optional(),
  ctaCount: z.number().int().min(0).optional(),
  hasForm: z.boolean().optional(),
});

export type PatternStats = z.infer<typeof PatternStatsSchema>;

export const PatternSchema = z.object({
  patternId: z.string(),
  type: z.string(),
  signature: z.string(),
  examples: z.array(z.string()),
  stats: PatternStatsSchema,
});

export type Pattern = z.infer<typeof PatternSchema>;

export const LayoutPatternsSchema = z.object({
  patterns: z.array(PatternSchema),
});

export type LayoutPatterns = z.infer<typeof LayoutPatternsSchema>;

// Spec Summary
export const PageStatusSchema = z.object({
  slug: z.string(),
  url: z.string(),
  status: z.enum(['success', 'failed']),
  sectionCount: z.number().int().min(0).optional(),
  warnings: z.array(z.string()).optional().default([]),
  error: z.string().nullable().optional(),
});

export type PageStatus = z.infer<typeof PageStatusSchema>;

export const SpecSummarySchema = z.object({
  version: z.literal('1.0.0'),
  generatedAt: z.string(),
  baseUrl: z.string(),
  stats: z.object({
    pagesProcessed: z.number().int().min(0),
    pagesSucceeded: z.number().int().min(0),
    pagesFailed: z.number().int().min(0),
    totalSections: z.number().int().min(0),
    totalPatterns: z.number().int().min(0),
  }),
  pages: z.array(PageStatusSchema),
  warnings: z.array(z.string()).optional().default([]),
});

export type SpecSummary = z.infer<typeof SpecSummarySchema>;

/**
 * Validate functions
 */
export function validatePageSpec(data: unknown): PageSpec {
  return PageSpecSchema.parse(data);
}

export function validateDesignTokens(data: unknown): DesignTokens {
  return DesignTokensSchema.parse(data);
}

export function validateLayoutPatterns(data: unknown): LayoutPatterns {
  return LayoutPatternsSchema.parse(data);
}

export function validateSpecSummary(data: unknown): SpecSummary {
  return SpecSummarySchema.parse(data);
}
