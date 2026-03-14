import { z } from 'zod';

export const MediaFileDTOSchema = z.object({
  name: z.string(),
  path: z.string(),
  url: z.string().url(),
  size: z.number(),
  createdAt: z.string(),
});
export type MediaFileDTO = z.infer<typeof MediaFileDTOSchema>;
