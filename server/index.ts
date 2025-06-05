// server/index.ts
import express from "express";
import cors from "cors";
import * as trpcExpress from "@trpc/server/adapters/express";
import { initTRPC } from "@trpc/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

require("dotenv").config();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Create Prisma client
const prisma = new PrismaClient();

// IMPORTANT: Configure Express middleware BEFORE tRPC setup
app.use(
  express.json({
    limit: "50mb", // Increase limit for image uploads
    type: "application/json",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "50mb",
  })
);

// Configure CORS
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://art-showcase.techness.in",
    ],
    credentials: true,
  })
);

// Create context for tRPC
const createContext = ({
  req,
  res,
}: trpcExpress.CreateExpressContextOptions) => {
  console.log("Creating tRPC context");
  return {
    prisma,
    req,
    res,
  };
};

type Context = Awaited<ReturnType<typeof createContext>>;

// Initialize tRPC
const t = initTRPC.context<Context>().create();

// Define input schema
const getArtworkInputSchema = z
  .object({
    searchQuery: z.string().optional().default(""),
    material: z.string().optional().default("all"),
    availability: z.string().optional().default("all"),
    featured: z.string().optional().default("all"),
    sortBy: z.string().optional().default("newest"),
    page: z.number().int().positive().optional().default(1),
    limit: z.number().int().positive().max(50).optional().default(12), // Max 50 items per page
  })
  .optional();

// Define id schema
const idschema = z.string().regex(/^[a-zA-Z0-9_-]{10,36}$/, {
  message: "Invalid ID format",
});

// Create router
const appRouter = t.router({
  // Queries

  // Get all artworks
  getAllArtworks: t.procedure
    .input(getArtworkInputSchema)
    .query(async (opts) => {
      const { input, ctx } = opts;

      console.log("=== PAGINATION REQUEST DEBUG ===");
      console.log("RAW INPUT received:", input);
      console.log("Input type:", typeof input);
      console.log("Input stringified:", JSON.stringify(input));

      // Use the parsed input directly (Zod has already processed it)
      const filters = input || {
        searchQuery: "",
        material: "all",
        availability: "all",
        featured: "all",
        sortBy: "newest",
        page: 1,
        limit: 12,
      };

      console.log("Processed filters:", filters);

      let where: any = {};
      let orderBy: any = {};

      // Apply search filter
      if (filters.searchQuery && filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        console.log("Applying search filter:", query);
        where.OR = [
          { title: { contains: query, mode: "insensitive" } },
          { artist: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { style: { contains: query, mode: "insensitive" } },
          { material: { contains: query, mode: "insensitive" } },
        ];
      }

      // Apply filters
      if (filters.material && filters.material !== "all") {
        console.log("Applying material filter:", filters.material);
        where.material = filters.material;
      }

      if (filters.availability && filters.availability !== "all") {
        console.log("Applying availability filter:", filters.availability);
        if (filters.availability === "available") {
          where.sold = false;
        } else if (filters.availability === "sold") {
          where.sold = true;
        }
      }

      if (filters.featured && filters.featured !== "all") {
        console.log("Applying featured filter:", filters.featured);
        if (filters.featured === "featured") {
          where.featured = true;
        } else if (filters.featured === "non-featured") {
          where.featured = false;
        }
      }

      // Apply sorting
      console.log("Applying sort:", filters.sortBy);
      switch (filters.sortBy) {
        case "newest":
          orderBy.createdAt = "desc";
          break;
        case "oldest":
          orderBy.createdAt = "asc";
          break;
        case "price-high":
          orderBy.price = "desc";
          break;
        case "price-low":
          orderBy.price = "asc";
          break;
        case "year-new":
          orderBy.year = "desc";
          break;
        case "year-old":
          orderBy.year = "asc";
          break;
        default:
          orderBy.createdAt = "desc";
          break;
      }

      // Calculate pagination
      const skip = (filters.page - 1) * filters.limit;
      const take = filters.limit;

      try {
        console.log("Final Prisma query:", {
          where,
          orderBy,
          skip,
          take,
          page: filters.page,
          limit: filters.limit,
        });

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

        console.log("Paginated query result:", {
          artworksCount: artworks.length,
          totalCount,
          page: filters.page,
          hasMore,
          totalPages,
        });

        return result;
      } catch (error) {
        console.error("Database query error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        throw new Error(`Database query failed: ${errorMessage}`);
      }
    }),

  // Get artwork by ID
  getArtworkById: t.procedure
    .input(z.object({ id: idschema }))
    .query(async (opts) => {
      const { input, ctx } = opts;
      try {
        const result = await ctx.prisma.artwork.findUnique({
          where: { id: input.id },
        });
        return result;
      } catch (error) {
        console.error("Database query error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        throw new Error(`Failed to fetch artwork: ${errorMessage}`);
      }
    }),

  // Get featured artworks
  getFeaturedArtworks: t.procedure.query(async (opts) => {
    const { ctx } = opts;
    try {
      console.log("Fetching featured artworks with limit 3");
      const result = await ctx.prisma.artwork.findMany({
        where: {
          featured: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 3,
      });
      console.log("Featured artworks found:", result.length);
      return result;
    } catch (error) {
      console.error("Database query error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Failed to fetch featured artworks: ${errorMessage}`);
    }
  }),

  // Get featured artworks
  getArtworksForHeroCarousel: t.procedure.query(async (opts) => {
    const { ctx } = opts;
    try {
      console.log("Fetching artworks with limit 5");
      const result = await ctx.prisma.artwork.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      });
      console.log("Artworks found:", result.length);
      return result;
    } catch (error) {
      console.error("Database query error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Failed to fetch artworks: ${errorMessage}`);
    }
  }),

  // Artwork statistics procedure
  getArtworkStats: t.procedure.query(async ({ ctx }) => {
    try {
      const [totalArtworksCount, featuredArtworksCount, soldArtworksCount] =
        await Promise.all([
          ctx.prisma.artwork.count(),
          ctx.prisma.artwork.count({ where: { featured: true } }),
          ctx.prisma.artwork.count({ where: { sold: true } }),
        ]);

      return {
        totalArtworksCount,
        featuredArtworksCount,
        soldArtworksCount,
      };
    } catch (error) {
      console.error("Error fetching artwork stats:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Failed to fetch artwork stats: ${errorMessage}`);
    }
  }),

  // Mutations
  createArtwork: t.procedure
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
        console.log("=== CREATE ARTWORK DEBUG ===");
        console.log("Raw input received:", JSON.stringify(input, null, 2));
        console.log("Input validation passed");

        // Create artwork in database
        const artworkData = {
          title: input.title,
          artist: input.artist,
          price: input.price,
          description: input.description || "",
          dimensions: input.dimensions || "",
          material: input.material,
          style: input.style || "",
          year: input.year,
          featured: input.featured,
          sold: input.sold,
          url: input.url,
          cloudinary_public_id: input.cloudinary_public_id,
          createdAt: new Date(),
        };

        console.log(
          "Artwork data to create:",
          JSON.stringify(artworkData, null, 2)
        );

        const result = await ctx.prisma.artwork.create({
          data: artworkData,
        });

        console.log("Artwork created successfully with ID:", result.id);
        return result;
      } catch (error) {
        console.error("Database creation error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        throw new Error(`Failed to create artwork: ${errorMessage}`);
      }
    }),

  // Update artwork procedure
  updateArtwork: t.procedure
    .input(
      z.object({
        id: idschema,
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
        console.log("Updating artwork with ID:", input.id);
        console.log("Update data:", input);

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
          throw new Error("Artwork not found");
        }

        // Update the artwork
        const result = await ctx.prisma.artwork.update({
          where: { id },
          data: {
            ...cleanUpdateData,
            updatedAt: new Date(),
          },
        });

        console.log("Artwork updated successfully:", result.id);
        return result;
      } catch (error) {
        console.error("Database update error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        throw new Error(`Failed to update artwork: ${errorMessage}`);
      }
    }),

  // Delete artwork procedure
  deleteArtwork: t.procedure
    .input(z.object({ id: idschema }))
    .mutation(async (opts) => {
      const { input, ctx } = opts;

      try {
        console.log("Deleting artwork with ID:", input.id);

        // First check if artwork exists
        const existingArtwork = await ctx.prisma.artwork.findUnique({
          where: { id: input.id },
        });

        if (!existingArtwork) {
          throw new Error("Artwork not found");
        }

        // Delete the artwork
        const result = await ctx.prisma.artwork.delete({
          where: { id: input.id },
        });

        console.log("Artwork deleted successfully:", result.id);
        return { success: true, deletedId: result.id };
      } catch (error) {
        console.error("Database deletion error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        throw new Error(`Failed to delete artwork: ${errorMessage}`);
      }
    }),
});

// Export type for client
export type AppRouter = typeof appRouter;

// Use tRPC Express adapter
app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
    onError: ({ error, path, input }) => {
      console.error("tRPC Error:", {
        path,
        input,
        error: error.message,
        stack: error.stack,
      });
    },
  })
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
