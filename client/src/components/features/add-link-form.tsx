import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Category, Tag, Link } from "@shared/schema";
import { isValidElement } from "react";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

// Validation schema for the form
const addLinkSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  title: z.string().min(1, "Title is required").max(150, "Title must be 150 characters or less"),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  notes: z.string().optional(),
  deadline: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High"]).default("Medium"),
  setReminder: z.boolean().default(false),
  tags: z.array(z.number()).default([]),
});

type FormValues = z.infer<typeof addLinkSchema>;

interface AddLinkFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<Link>;
  isEdit?: boolean;
}

interface UrlMetadata {
  title: string;
  description: string;
  favicon: string;
}

export function AddLinkForm({ isOpen, onClose, initialData, isEdit = false }: AddLinkFormProps) {
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  // Fetch tags
  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["/api/tags"],
  });
  
  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(addLinkSchema),
    defaultValues: {
      url: initialData?.url || "",
      title: initialData?.title || "",
      description: initialData?.description || "",
      categoryId: initialData?.categoryId?.toString() || "",
      notes: initialData?.notes || "",
      deadline: initialData?.deadline 
        ? new Date(initialData.deadline).toISOString().split('T')[0] 
        : "",
      priority: initialData?.priority || "Medium",
      setReminder: false,
      tags: [],
    },
  });
  
  // Fetch metadata when URL changes
  const { mutate: scrapeUrl, isPending: isScrapingUrl } = useMutation<UrlMetadata>({
    mutationFn: async (url: string) => {
      const res = await apiRequest("POST", "/api/scrape-url", { url });
      return res.json();
    },
    onSuccess: (data) => {
      // Only auto-fill if fields are empty
      if (!form.getValues().title) {
        form.setValue("title", data.title);
      }
      if (!form.getValues().description) {
        form.setValue("description", data.description);
      }
    },
  });

  // Handle URL changes to fetch metadata
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "url" && value.url && !isEdit) {
        const url = value.url as string;
        if (url.startsWith("http") && url.includes(".")) {
          scrapeUrl(url);
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, scrapeUrl, isEdit]);

  // Setup mutations for saving links
  const createLinkMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Convert categoryId from string to number or undefined
      const categoryId = data.categoryId ? parseInt(data.categoryId) : undefined;
      
      // Convert date string to ISO string if present
      const deadline = data.deadline ? new Date(data.deadline).toISOString() : undefined;
      
      const link = {
        url: data.url,
        title: data.title,
        description: data.description,
        categoryId,
        notes: data.notes,
        deadline,
        priority: data.priority,
        tags: data.tags,
      };
      
      const res = await apiRequest("POST", "/api/links", link);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Link saved",
        description: "Your link has been successfully saved",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save link",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateLinkMutation = useMutation({
    mutationFn: async (data: FormValues & { id: number }) => {
      // Convert categoryId from string to number or undefined
      const categoryId = data.categoryId ? parseInt(data.categoryId) : undefined;
      
      // Convert date string to ISO string if present
      const deadline = data.deadline ? new Date(data.deadline).toISOString() : undefined;
      
      const link = {
        url: data.url,
        title: data.title,
        description: data.description,
        categoryId,
        notes: data.notes,
        deadline,
        priority: data.priority,
        tags: data.tags,
      };
      
      const res = await apiRequest("PUT", `/api/links/${data.id}`, link);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Link updated",
        description: "Your link has been successfully updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update link",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    if (isEdit && initialData?.id) {
      updateLinkMutation.mutate({ ...data, id: initialData.id });
    } else {
      createLinkMutation.mutate(data);
    }
  };

  // Add a tag
  const addTag = (tagId: number) => {
    const tag = tags.find(t => t.id === tagId);
    if (tag && !selectedTags.some(t => t.id === tag.id)) {
      setSelectedTags([...selectedTags, tag]);
      
      // Update form values
      const currentTags = form.getValues().tags || [];
      form.setValue("tags", [...currentTags, tag.id]);
    }
  };

  // Remove a tag
  const removeTag = (tagId: number) => {
    setSelectedTags(selectedTags.filter(tag => tag.id !== tagId));
    
    // Update form values
    const currentTags = form.getValues().tags || [];
    form.setValue("tags", currentTags.filter(id => id !== tagId));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Link" : "Add New Link"}</DialogTitle>
          <DialogDescription>
            {isEdit 
              ? "Update the details of your saved link." 
              : "Save a new link to your collection and organize it with categories and tags."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com" 
                      {...field} 
                      disabled={isScrapingUrl}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Link title" 
                      {...field} 
                      disabled={isScrapingUrl}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deadline</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="A brief description of the link" 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional information about this link..." 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <div className="flex items-center">
                <Select onValueChange={(value) => addTag(parseInt(value))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Add tags" />
                  </SelectTrigger>
                  <SelectContent>
                    {tags.map(tag => (
                      <SelectItem key={tag.id} value={tag.id.toString()}>
                        {tag.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedTags.map(tag => (
                    <Badge key={tag.id} variant="secondary" className="text-xs">
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => removeTag(tag.id)}
                        className="ml-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </FormItem>
            
            <FormField
              control={form.control}
              name="setReminder"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Set reminder</FormLabel>
                    <FormDescription>
                      Receive a notification before the deadline
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createLinkMutation.isPending || updateLinkMutation.isPending}
              >
                {(createLinkMutation.isPending || updateLinkMutation.isPending) && (
                  <FontAwesomeIcon icon="spinner" className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEdit ? "Update Link" : "Save Link"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
