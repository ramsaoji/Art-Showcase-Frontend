// src/routes/artwork.ts
import { z } from 'zod';
import { router, procedure } from '../trpc';
import logger from '../config/logger';

// Define input schema
const getArtworkInputSchema = z
  .object({
    searchQuery: z.string().optional().default(''),
    material: z.string().optional().default('all'),
    availability: z.string().optional().default('all'),
    featured: z.string().optional().default('all'),
    sortBy: z.string().optional().default('newest'),
    page: z.number().int().positive().optional().default(1),
    limit: z.number().int().positive().max(50).optional().default(12), // Max 50 items per page
  })
  .optional();

// Define id schema
const idSchema = z.string().regex(/^[a-zA-Z0-9_-]{10,36}$/, {
  message: 'Invalid ID format',
});

// Create artwork router
export const artworkRouter = router({
  // Get all artworks
  getAllArtworks: procedure
    .input(getArtworkInputSchema)
    .query(async (opts) => {
      const { input, ctx } = opts;

      logger.debug({ input }, 'Pagination request received');

      // Use the parsed input directly (Zod has already processed it)
      const filters = input || {
        searchQuery: '',
        material: 'all',
        availability: 'all',
        featured: 'all',
        sortBy: 'newest',
        page: 1,
        limit: 12,
      };

      logger.debug({ filters }, 'Processed filters');

      let where: any = {};
      let orderBy: any = {};

      // Apply search filter
      if (filters.searchQuery && filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        logger.debug({ query }, 'Applying search filter');
        where.OR = [
          { title: { contains: query, mode: 'insensitive' } },
          { artist: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { style: { contains: query, mode: 'insensitive' } },
          { material: { contains: query, mode: 'insensitive' } },
        ];
      }

      // Apply filters
      if (filters.material && filters.material !== 'all') {
        logger.debug({ material: filters.material }, 'Applying material filter');
        where.material = filters.material;
      }

      if (filters.availability && filters.availability !== 'all') {
        logger.debug({ availability: filters.availability }, 'Applying availability filter');
        if (filters.availability === 'available') {
          where.sold = false;
        } else if (filters.availability === 'sold') {
          where.sold = true;
        }
      }

      if (filters.featured && filters.featured !== 'all') {
        logger.debug({ featured: filters.featured }, 'Applying featured filter');
        if (filters.featured === 'featured') {
          where.featured = true;
        } else if (filters.featured === 'non-featured') {
          where.featured = false;
        }
      }

      // Apply sorting
      logger.debug({ sortBy: filters.sortBy }, 'Applying sort');
      switch (filters.sortBy) {
        case 'newest':
          orderBy.createdAt = 'desc';
          break;
        case 'oldest':
          orderBy.createdAt = 'asc';
          break;
        case 'price-high':
          orderBy.price = 'desc';
          break;
        case 'price-low':
          orderBy.price = 'asc';
          break;
        case 'year-new':
          orderBy.year = 'desc';
          break;
        case 'year-old':
          orderBy.year = 'asc';
          break;
        default:
          orderBy.createdAt = 'desc';
          break;
      }

      // Calculate pagination
      const skip = (filters.page - 1) * filters.limit;
      const take = filters.limit;

      try {
        logger.debug(
          { where, orderBy, skip, take, page: filters.page, limit: filters.limit },
          'Final Prisma query'
        );

        // Execute both the main query and count query in parallel
        const [artworks, totalCount] = await Promise.all([
          ctx.prisma.artwork.findMany({
            where,
            orderBy,
            skip,
            take,
          }),
          ctx.prisma.artwork.count({
            where,
          }),
        ]);

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalCount / filters.limit);
        const hasMore = filters.page < totalPages;
        const hasPrevious = filters.page > 1;

        const result = {
          artworks,
          pagination: {
            page: filters.page,
            limit: filters.limit,
            totalCount,
            totalPages,
            hasMore,
            hasPrevious,
          },
          // Keep these for backward compatibility with frontend
          totalCount,
          hasMore,
        };

        logger.info(
          {
            artworksCount: artworks.length,
            totalCount,
            page: filters.page,
            hasMore,
            totalPages,
          },
          'Paginated query result'
        );

        return result;
      } catch (error) {
        logger.error({ error }, 'Database query error');
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`Database query failed: ${errorMessage}`);
      }
    }),

  // Get artwork by ID
  getArtworkById: procedure
    .input(z.object({ id: idSchema }))
    .query(async (opts) => {
      const { input, ctx } = opts;
      try {
        logger.debug({ id: input.id }, 'Fetching artwork by ID');
        const result = await ctx.prisma.artwork.findUnique({
          where: { id: input.id },
        });
        return result;
      } catch (error) {
        logger.error({ error, id: input.id }, 'Error fetching artwork by ID');
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`Failed to fetch artwork: ${errorMessage}`);
      }
    }),

  // Get featured artworks
  getFeaturedArtworks: procedure.query(async (opts) => {
    const { ctx } = opts;
    try {
      logger.debug('Fetching featured artworks with limit 3');
      const result = await ctx.prisma.artwork.findMany({
        where: {
          featured: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 3,
      });
      logger.info({ count: result.length }, 'Featured artworks found');
      return result;
    } catch (error) {
      logger.error({ error }, 'Error fetching featured artworks');
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to fetch featured artworks: ${errorMessage}`);
    }
  }),

  // Get artworks for hero carousel
  getArtworksForHeroCarousel: procedure.query(async (opts) => {
    const { ctx } = opts;
    try {
      logger.debug('Fetching artworks for hero carousel with limit 5');
      const result = await ctx.prisma.artwork.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      });
      logger.info({ count: result.length }, 'Artworks for hero carousel found');
      return result;
    } catch (error) {
      logger.error({ error }, 'Error fetching artworks for hero carousel');
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to fetch artworks: ${errorMessage}`);
    }
  }),

  // Artwork statistics procedure
  getArtworkStats: procedure.query(async ({ ctx }) => {
    try {
      logger.debug('Fetching artwork statistics');
      const [totalArtworksCount, featuredArtworksCount, soldArtworksCount] =
        await Promise.all([
          ctx.prisma.artwork.count(),
          ctx.prisma.artwork.count({ where: { featured: true } }),
          ctx.prisma.artwork.count({ where: { sold: true } }),
        ]);

      const stats = {
        totalArtworksCount,
        featuredArtworksCount,
        soldArtworksCount,
      };

      logger.info({ stats }, 'Artwork statistics fetched');
      return stats;
    } catch (error) {
      logger.error({ error }, 'Error fetching artwork stats');
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to fetch artwork stats: ${errorMessage}`);
    }
  }),

  // Create artwork procedure
  createArtwork: procedure
    .input(
      z.object({
        title: z.string().min(1),
        artist: z.string().min(1),
        price: z.number().positive(),
        description: z.string().optional(),
        dimensions: z.string().optional(),
        material: z.string().min(1),
        style: z.string().optional(),
        year: z.number().int().positive(),
        featured: z.boolean().default(false),
        sold: z.boolean().default(false),
        url: z.string().url().optional(),
        cloudinary_public_id: z.string().optional(),
      })
    )
    .mutation(async (opts) => {
      const { input, ctx } = opts;

      try {
        logger.debug({ input }, 'Creating new artwork');

        // Create artwork in database
        const artworkData = {
          title: input.title,
          artist: input.artist,
          price: input.price,
          description: input.description || '',
          dimensions: input.dimensions || '',
          material: input.material,
          style: input.style || '',
          year: input.year,
          featured: input.featured,
          sold: input.sold,
          url: input.url,
          cloudinary_public_id: input.cloudinary_public_id,
          createdAt: new Date(),
        };

        logger.debug({ artworkData }, 'Artwork data to create');

        const result = await ctx.prisma.artwork.create({
          data: artworkData,
        });

        logger.info({ id: result.id }, 'Artwork created successfully');
        return result;
      } catch (error) {
        logger.error({ error, input }, 'Error creating artwork');
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`Failed to create artwork: ${errorMessage}`);
      }
    }),

  // Update artwork procedure
  updateArtwork: procedure
    .input(
      z.object({
        id: idSchema,
        title: z.string().min(1).optional(),
        artist: z.string().min(1).optional(),
        price: z.number().positive().optional(),
        description: z.string().optional(),
        dimensions: z.string().optional(),
        material: z.string().min(1).optional(),
        style: z.string().optional(),
        year: z.number().int().positive().optional(),
        featured: z.boolean().optional(),
        sold: z.boolean().optional(),
        url: z.string().url().optional(),
        cloudinary_public_id: z.string().optional(),
      })
    )
    .mutation(async (opts) => {
      const { input, ctx } = opts;

      try {
        logger.debug({ id: input.id, input }, 'Updating artwork');

        // Extract ID and create update data object
        const { id, ...updateData } = input;

        // Remove undefined values to avoid overwriting with undefined
        const cleanUpdateData = Object.fromEntries(
          Object.entries(updateData).filter(([_, value]) => value !== undefined)
        );

        // First check if artwork exists
        const existingArtwork = await ctx.prisma.artwork.findUnique({
          where: { id },
        });

        if (!existingArtwork) {
          logger.warn({ id }, 'Artwork not found for update');
          throw new Error('Artwork not found');
        }

        // Update the artwork
        const result = await ctx.prisma.artwork.update({
          where: { id },
          data: {
            ...cleanUpdateData,
            updatedAt: new Date(),
          },
        });

        logger.info({ id: result.id }, 'Artwork updated successfully');
        return result;
      } catch (error) {
        logger.error({ error, id: input.id }, 'Error updating artwork');
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`Failed to update artwork: ${errorMessage}`);
      }
    }),

  // Delete artwork procedure
  deleteArtwork: procedure
    .input(z.object({ id: idSchema }))
    .mutation(async (opts) => {
      const { input, ctx } = opts;

      try {
        logger.debug({ id: input.id }, 'Deleting artwork');

        // First check if artwork exists
        const existingArtwork = await ctx.prisma.artwork.findUnique({
          where: { id: input.id },
        });

        if (!existingArtwork) {
          logger.warn({ id: input.id }, 'Artwork not found for deletion');
          throw new Error('Artwork not found');
        }

        // Delete the artwork
        const result = await ctx.prisma.artwork.delete({
          where: { id: input.id },
        });

        logger.info({ id: result.id }, 'Artwork deleted successfully');
        return { success: true, deletedId: result.id };
      } catch (error) {
        logger.error({ error, id: input.id }, 'Error deleting artwork');
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`Failed to delete artwork: ${errorMessage}`);
      }
    }),
});