import { z } from "zod";

import { SHOP_FORMATS } from "@/types/database";

const optionalUrlSchema = z
  .preprocess(
    (value) => {
      if (typeof value === "string" && value.trim() === "") {
        return null;
      }
      return value;
    },
    z.string().url().nullable().optional()
  )
  .transform((value) => value ?? null);

const optionalStringSchema = z
  .preprocess(
    (value) => {
      if (typeof value === "string" && value.trim() === "") {
        return null;
      }
      return value;
    },
    z.string().trim().max(1000).nullable().optional()
  )
  .transform((value) => value ?? null);

export const createSubmissionSchema = z.object({
  name: z.string().trim().min(2).max(200),
  country: z.string().trim().min(2).max(120),
  city: z.string().trim().min(1).max(120),
  address: z.string().trim().min(2).max(250),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  instagram_url: optionalUrlSchema,
  website_url: optionalUrlSchema,
  format: z.enum(SHOP_FORMATS).default("unknown"),
  submitted_by_email: z.string().trim().email().max(255).optional().nullable(),
  source_note: optionalStringSchema,
  company: z.string().max(255).optional().default("")
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
