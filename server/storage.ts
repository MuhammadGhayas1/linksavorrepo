import {
  users,
  links,
  categories,
  tags,
  linksTags,
  reminders,
  type User,
  type Link,
  type Category,
  type Tag,
  type Reminder,
  type LinkTag,
  type InsertUser,
  type InsertLink,
  type InsertCategory,
  type InsertTag,
  type InsertReminder
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, ilike, desc, asc, or, isNull, not, lt, gte, sql } from "drizzle-orm";
import createMemoryStore from "memorystore";
import session from "express-session";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  sessionStore: session.Store;
  
  // User
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  
  // Links
  getLinks(userId: number, options?: {
    search?: string;
    categoryId?: number;
    status?: string;
    tags?: string[];
    sort?: string;
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<Link[]>;
  getLinkById(id: number, userId: number): Promise<Link | undefined>;
  createLink(link: InsertLink): Promise<Link>;
  updateLink(id: number, linkData: Partial<InsertLink>): Promise<Link | undefined>;
  deleteLink(id: number): Promise<void>;
  
  // Categories
  getCategories(userId: number): Promise<Category[]>;
  getCategoryById(id: number, userId: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<void>;
  
  // Tags
  getTags(userId: number): Promise<Tag[]>;
  getTagById(id: number, userId: number): Promise<Tag | undefined>;
  createTag(tag: InsertTag): Promise<Tag>;
  updateTag(id: number, tagData: Partial<InsertTag>): Promise<Tag | undefined>;
  deleteTag(id: number): Promise<void>;
  
  // Link-Tag Relationships
  addTagToLink(linkId: number, tagId: number): Promise<LinkTag>;
  removeTagFromLink(linkId: number, tagId: number): Promise<void>;
  removeAllTagsFromLink(linkId: number): Promise<void>;
  
  // Reminders
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  
  // Dashboard data
  countLinks(userId: number): Promise<number>;
  countLinksByStatus(userId: number, status: string): Promise<number>;
  countTags(userId: number): Promise<number>;
  getUpcomingDeadlines(userId: number): Promise<Link[]>;
  getRecentLinks(userId: number, limit: number): Promise<Link[]>;
  getUpcomingDeadlineLinks(userId: number, limit: number): Promise<Link[]>;
  
  // Utilities
  scrapeUrlMetadata(url: string): Promise<{
    title: string;
    description: string;
    favicon: string;
  }>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Links methods
  async getLinks(userId: number, options: {
    search?: string;
    categoryId?: number;
    status?: string;
    tags?: string[];
    sort?: string;
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  } = {}): Promise<Link[]> {
    const {
      search,
      categoryId,
      status,
      tags,
      sort = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10
    } = options;
    
    // Start with base query for this user
    let query = db.select().from(links).where(eq(links.userId, userId));
    
    // Add search filter if provided
    if (search) {
      query = query.where(
        or(
          ilike(links.title, `%${search}%`),
          ilike(links.url, `%${search}%`),
          ilike(links.notes || '', `%${search}%`)
        )
      );
    }
    
    // Add category filter if provided
    if (categoryId) {
      query = query.where(eq(links.categoryId, categoryId));
    }
    
    // Add status filter if provided
    if (status) {
      query = query.where(eq(links.status, status));
    }
    
    // Apply sorting
    if (sort === 'deadline') {
      if (order === 'asc') {
        query = query.orderBy(asc(links.deadline));
      } else {
        query = query.orderBy(desc(links.deadline));
      }
    } else if (sort === 'title') {
      if (order === 'asc') {
        query = query.orderBy(asc(links.title));
      } else {
        query = query.orderBy(desc(links.title));
      }
    } else if (sort === 'priority') {
      if (order === 'asc') {
        query = query.orderBy(asc(links.priority));
      } else {
        query = query.orderBy(desc(links.priority));
      }
    } else {
      // Default to createdAt
      if (order === 'asc') {
        query = query.orderBy(asc(links.createdAt));
      } else {
        query = query.orderBy(desc(links.createdAt));
      }
    }
    
    // Apply pagination
    query = query.limit(limit).offset((page - 1) * limit);
    
    // Execute the query
    let linksResult = await query;
    
    // If tags filter is provided, we need to do additional filtering
    // since it requires joining with linksTags
    if (tags && tags.length > 0) {
      // Get all the tag IDs that match the tag names
      const tagRecords = await db
        .select()
        .from(tags)
        .where(and(
          eq(tags.userId, userId),
          or(...tags.map(tag => eq(tags.name, tag)))
        ));
      
      const tagIds = tagRecords.map(tag => tag.id);
      
      if (tagIds.length > 0) {
        // Get all link_ids that have ALL of these tags
        const linkTagsRecords = await db
          .select()
          .from(linksTags)
          .where(or(...tagIds.map(tagId => eq(linksTags.tagId, tagId))));
        
        // Count how many tags each link has
        const linkTagCounts: Record<number, number> = {};
        for (const record of linkTagsRecords) {
          linkTagCounts[record.linkId] = (linkTagCounts[record.linkId] || 0) + 1;
        }
        
        // Filter links that have ALL the requested tags
        linksResult = linksResult.filter(link => 
          linkTagCounts[link.id] && linkTagCounts[link.id] === tagIds.length
        );
      }
    }
    
    return linksResult;
  }

  async getLinkById(id: number, userId: number): Promise<Link | undefined> {
    const [link] = await db
      .select()
      .from(links)
      .where(and(eq(links.id, id), eq(links.userId, userId)));
    
    return link;
  }

  async createLink(linkData: InsertLink): Promise<Link> {
    const [link] = await db.insert(links).values(linkData).returning();
    return link;
  }

  async updateLink(id: number, linkData: Partial<InsertLink>): Promise<Link | undefined> {
    const [updatedLink] = await db
      .update(links)
      .set(linkData)
      .where(eq(links.id, id))
      .returning();
    
    return updatedLink;
  }

  async deleteLink(id: number): Promise<void> {
    await db.delete(links).where(eq(links.id, id));
  }

  // Categories methods
  async getCategories(userId: number): Promise<Category[]> {
    return db.select().from(categories).where(eq(categories.userId, userId));
  }

  async getCategoryById(id: number, userId: number): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)));
    
    return category;
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(categoryData).returning();
    return category;
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set(categoryData)
      .where(eq(categories.id, id))
      .returning();
    
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<void> {
    // First update all links that use this category to have null categoryId
    await db
      .update(links)
      .set({ categoryId: null })
      .where(eq(links.categoryId, id));
    
    // Then delete the category
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Tags methods
  async getTags(userId: number): Promise<Tag[]> {
    return db.select().from(tags).where(eq(tags.userId, userId));
  }

  async getTagById(id: number, userId: number): Promise<Tag | undefined> {
    const [tag] = await db
      .select()
      .from(tags)
      .where(and(eq(tags.id, id), eq(tags.userId, userId)));
    
    return tag;
  }

  async createTag(tagData: InsertTag): Promise<Tag> {
    const [tag] = await db.insert(tags).values(tagData).returning();
    return tag;
  }

  async updateTag(id: number, tagData: Partial<InsertTag>): Promise<Tag | undefined> {
    const [updatedTag] = await db
      .update(tags)
      .set(tagData)
      .where(eq(tags.id, id))
      .returning();
    
    return updatedTag;
  }

  async deleteTag(id: number): Promise<void> {
    // Delete all link-tag associations for this tag
    await db.delete(linksTags).where(eq(linksTags.tagId, id));
    
    // Then delete the tag
    await db.delete(tags).where(eq(tags.id, id));
  }

  // Link-Tag Relationships
  async addTagToLink(linkId: number, tagId: number): Promise<LinkTag> {
    const [linkTag] = await db
      .insert(linksTags)
      .values({ linkId, tagId })
      .returning();
    
    return linkTag;
  }

  async removeTagFromLink(linkId: number, tagId: number): Promise<void> {
    await db
      .delete(linksTags)
      .where(and(eq(linksTags.linkId, linkId), eq(linksTags.tagId, tagId)));
  }

  async removeAllTagsFromLink(linkId: number): Promise<void> {
    await db
      .delete(linksTags)
      .where(eq(linksTags.linkId, linkId));
  }

  // Reminders
  async createReminder(reminderData: InsertReminder): Promise<Reminder> {
    const [reminder] = await db.insert(reminders).values(reminderData).returning();
    return reminder;
  }

  // Dashboard data
  async countLinks(userId: number): Promise<number> {
    const result = await db
      .select({ count: sql`count(*)` })
      .from(links)
      .where(eq(links.userId, userId));
    
    return Number(result[0].count);
  }

  async countLinksByStatus(userId: number, status: string): Promise<number> {
    const result = await db
      .select({ count: sql`count(*)` })
      .from(links)
      .where(and(eq(links.userId, userId), eq(links.status, status)));
    
    return Number(result[0].count);
  }

  async countTags(userId: number): Promise<number> {
    const result = await db
      .select({ count: sql`count(*)` })
      .from(tags)
      .where(eq(tags.userId, userId));
    
    return Number(result[0].count);
  }

  async getUpcomingDeadlines(userId: number): Promise<Link[]> {
    const today = new Date();
    
    return db
      .select()
      .from(links)
      .where(and(
        eq(links.userId, userId),
        not(eq(links.status, "Completed")),
        not(eq(links.status, "Rejected")),
        not(isNull(links.deadline)),
        gte(links.deadline, today)
      ))
      .orderBy(asc(links.deadline))
      .limit(5);
  }

  async getRecentLinks(userId: number, limit: number): Promise<Link[]> {
    return db
      .select()
      .from(links)
      .where(eq(links.userId, userId))
      .orderBy(desc(links.createdAt))
      .limit(limit);
  }

  async getUpcomingDeadlineLinks(userId: number, limit: number): Promise<Link[]> {
    const today = new Date();
    
    return db
      .select()
      .from(links)
      .where(and(
        eq(links.userId, userId),
        not(eq(links.status, "Completed")),
        not(eq(links.status, "Rejected")),
        not(isNull(links.deadline)),
        gte(links.deadline, today)
      ))
      .orderBy(asc(links.deadline))
      .limit(limit);
  }

  // Utilities
  async scrapeUrlMetadata(url: string): Promise<{ title: string; description: string; favicon: string; }> {
    try {
      const response = await fetch(url);
      const html = await response.text();
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      // Get title
      let title = document.querySelector('title')?.textContent || '';
      
      // Try to get meta description
      let description = '';
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription && metaDescription.hasAttribute('content')) {
        description = metaDescription.getAttribute('content') || '';
      }
      
      // Try to get Open Graph description as fallback
      if (!description) {
        const ogDescription = document.querySelector('meta[property="og:description"]');
        if (ogDescription && ogDescription.hasAttribute('content')) {
          description = ogDescription.getAttribute('content') || '';
        }
      }
      
      // Get favicon
      let favicon = '';
      const faviconLink = document.querySelector('link[rel="icon"]') || 
                         document.querySelector('link[rel="shortcut icon"]');
      
      if (faviconLink && faviconLink.hasAttribute('href')) {
        const faviconHref = faviconLink.getAttribute('href') || '';
        
        // Handle relative URLs
        if (faviconHref.startsWith('/')) {
          const urlObj = new URL(url);
          favicon = `${urlObj.origin}${faviconHref}`;
        } else if (!faviconHref.startsWith('http')) {
          const urlObj = new URL(url);
          favicon = `${urlObj.origin}/${faviconHref}`;
        } else {
          favicon = faviconHref;
        }
      }
      
      return { title, description, favicon };
    } catch (error) {
      console.error('Error scraping URL metadata:', error);
      return { title: '', description: '', favicon: '' };
    }
  }
}

export const storage = new DatabaseStorage();
