import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import {
  insertLinkSchema,
  insertCategorySchema,
  insertTagSchema,
  insertReminderSchema
} from "@shared/schema";
import { eq, and, like, desc, asc, or, isNull, not } from "drizzle-orm";

// Helper function to ensure a user is authenticated
function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  setupAuth(app);

  // Links API routes
  app.get("/api/links", requireAuth, async (req, res, next) => {
    try {
      const { search, categoryId, status, tags, sort, order, page = 1, limit = 10 } = req.query;
      const userId = req.user!.id;
      
      const links = await storage.getLinks(userId, {
        search: search as string,
        categoryId: categoryId ? Number(categoryId) : undefined,
        status: status as string,
        tags: tags ? (Array.isArray(tags) ? tags : [tags]) as string[] : undefined,
        sort: sort as string,
        order: order as 'asc' | 'desc',
        page: Number(page),
        limit: Number(limit)
      });
      
      res.json(links);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/links/:id", requireAuth, async (req, res, next) => {
    try {
      const linkId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      const link = await storage.getLinkById(linkId, userId);
      
      if (!link) {
        return res.status(404).json({ message: "Link not found" });
      }
      
      res.json(link);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/links", requireAuth, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const linkData = insertLinkSchema.parse({
        ...req.body,
        userId
      });
      
      const link = await storage.createLink(linkData);
      
      // Add tags if provided
      if (req.body.tags && Array.isArray(req.body.tags)) {
        await Promise.all(req.body.tags.map(async (tagId: number) => {
          await storage.addTagToLink(link.id, tagId);
        }));
      }
      
      res.status(201).json(link);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });

  app.put("/api/links/:id", requireAuth, async (req, res, next) => {
    try {
      const linkId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Verify ownership
      const existingLink = await storage.getLinkById(linkId, userId);
      if (!existingLink) {
        return res.status(404).json({ message: "Link not found" });
      }
      
      const updatedLink = await storage.updateLink(linkId, req.body);
      
      // Update tags if provided
      if (req.body.tags && Array.isArray(req.body.tags)) {
        // Remove existing tags
        await storage.removeAllTagsFromLink(linkId);
        
        // Add new tags
        await Promise.all(req.body.tags.map(async (tagId: number) => {
          await storage.addTagToLink(linkId, tagId);
        }));
      }
      
      res.json(updatedLink);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });

  app.delete("/api/links/:id", requireAuth, async (req, res, next) => {
    try {
      const linkId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Verify ownership
      const existingLink = await storage.getLinkById(linkId, userId);
      if (!existingLink) {
        return res.status(404).json({ message: "Link not found" });
      }
      
      await storage.deleteLink(linkId);
      
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Categories API routes
  app.get("/api/categories", requireAuth, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const categories = await storage.getCategories(userId);
      res.json(categories);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/categories", requireAuth, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const categoryData = insertCategorySchema.parse({
        ...req.body,
        userId
      });
      
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });

  app.put("/api/categories/:id", requireAuth, async (req, res, next) => {
    try {
      const categoryId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Verify ownership
      const existingCategory = await storage.getCategoryById(categoryId, userId);
      if (!existingCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      const updatedCategory = await storage.updateCategory(categoryId, req.body);
      res.json(updatedCategory);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });

  app.delete("/api/categories/:id", requireAuth, async (req, res, next) => {
    try {
      const categoryId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Verify ownership
      const existingCategory = await storage.getCategoryById(categoryId, userId);
      if (!existingCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      await storage.deleteCategory(categoryId);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Tags API routes
  app.get("/api/tags", requireAuth, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const tags = await storage.getTags(userId);
      res.json(tags);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/tags", requireAuth, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const tagData = insertTagSchema.parse({
        ...req.body,
        userId
      });
      
      const tag = await storage.createTag(tagData);
      res.status(201).json(tag);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });

  app.put("/api/tags/:id", requireAuth, async (req, res, next) => {
    try {
      const tagId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Verify ownership
      const existingTag = await storage.getTagById(tagId, userId);
      if (!existingTag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      
      const updatedTag = await storage.updateTag(tagId, req.body);
      res.json(updatedTag);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });

  app.delete("/api/tags/:id", requireAuth, async (req, res, next) => {
    try {
      const tagId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Verify ownership
      const existingTag = await storage.getTagById(tagId, userId);
      if (!existingTag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      
      await storage.deleteTag(tagId);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Reminders API routes
  app.post("/api/reminders", requireAuth, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const reminderData = insertReminderSchema.parse({
        ...req.body,
        userId
      });
      
      const reminder = await storage.createReminder(reminderData);
      res.status(201).json(reminder);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });

  // Dashboard data
  app.get("/api/dashboard", requireAuth, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      
      // Get stats
      const totalLinks = await storage.countLinks(userId);
      const upcomingDeadlines = await storage.getUpcomingDeadlines(userId);
      const completedLinks = await storage.countLinksByStatus(userId, "Completed");
      const tagsUsed = await storage.countTags(userId);
      
      // Get recent links
      const recentLinks = await storage.getRecentLinks(userId, 6);
      
      // Get upcoming deadlines links
      const upcomingDeadlineLinks = await storage.getUpcomingDeadlineLinks(userId, 3);
      
      res.json({
        stats: {
          totalLinks,
          upcomingDeadlines: upcomingDeadlines.length,
          completedLinks,
          tagsUsed
        },
        recentLinks,
        upcomingDeadlineLinks
      });
    } catch (error) {
      next(error);
    }
  });

  // Metadata scraping endpoint
  app.post("/api/scrape-url", requireAuth, async (req, res, next) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ message: "URL is required" });
      }
      
      const metadata = await storage.scrapeUrlMetadata(url);
      res.json(metadata);
    } catch (error) {
      res.status(500).json({ message: "Failed to scrape URL", error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
