import { z } from 'zod';

/** API health response — shared between Nest and any clients. */
export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.string(),
  version: z.string().optional(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const createHealthResponse = (service: string, version?: string): HealthResponse => ({
  status: 'ok',
  service,
  ...(version !== undefined ? { version } : {}),
});
