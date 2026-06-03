import { z } from 'zod';
import { insertCampaignSchema, insertDonationSchema, insertProgramSchema, insertRegistrationSchema, campaigns, donations, programs, registrations } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  campaigns: {
    list: {
      method: 'GET' as const,
      path: '/api/campaigns',
      responses: {
        200: z.array(z.custom<typeof campaigns.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/campaigns',
      input: insertCampaignSchema,
      responses: {
        201: z.custom<typeof campaigns.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/campaigns/:id',
      responses: {
        200: z.custom<typeof campaigns.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  donations: {
    create: {
      method: 'POST' as const,
      path: '/api/donations',
      input: insertDonationSchema,
      responses: {
        201: z.custom<typeof donations.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/donations',
      responses: {
        200: z.array(z.custom<typeof donations.$inferSelect>()),
      },
    },
  },
  programs: {
    list: {
      method: 'GET' as const,
      path: '/api/programs',
      responses: {
        200: z.array(z.custom<typeof programs.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/programs',
      input: insertProgramSchema,
      responses: {
        201: z.custom<typeof programs.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  registrations: {
    create: {
      method: 'POST' as const,
      path: '/api/registrations',
      input: insertRegistrationSchema,
      responses: {
        201: z.custom<typeof registrations.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: { // For admin/dashboard
      method: 'GET' as const,
      path: '/api/registrations',
      responses: {
        200: z.array(z.custom<typeof registrations.$inferSelect>()),
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
