import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useClipboard } from "@/hooks/use-clipboard";
import { Sidebar } from "@/components/layouts/sidebar";
import { MobileMenu } from "@/components/layouts/mobile-menu";
import { LinkCard } from "@/components/features/link-card";
import { AddLinkForm } from "@/components/features/add-link-form";
import { ClipboardNotification } from "@/components/features/clipboard-notification";
import { Link, Category, Tag, InsertLink } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useSearch } from "wouter";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LinksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  
  // Get URL search params
  const searchParams = new URLSearchParams(useSearch());
  const urlCategoryId = searchParams.get('category');
  const urlSort = searchParams.get('sort') || 'createdAt';
  const urlOrder = searchParams.get('order') || 'desc';
  const urlStatus = searchParams.get('status');
  
  // State for filters and UI
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryId, setCategoryId] = useState(urlCategoryId || "");
  const [status, setStatus] = useState(urlStatus || "");
  const [sort, setSort] = useState(urlSort);
  const [order, setOrder] = useState(urlOrder);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
  const [isEditLinkOpen, setIsEditLinkOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  
  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (categoryId) params.set('category', categoryId);
    if (status) params.set('status', status);
    if (sort !== 'createdAt') params.set('sort', sort);
    if (order !== 'desc') params.set('order', order);
    
    const queryString = params.toString();
    setLocation(`/links${queryString ? `?${queryString}` : ''}`, { replace: true });
  }, [categoryId, status, sort, order, setLocation]);
  
  // Fetch links
  const { data: links = [], isLoading: isLoadingLinks } = useQuery<Link[]>({
    queryKey: ["/api/links", { search: searchQuery, categoryId, status, sort, order }],
    queryFn: async ({ queryKey }) => {
      const [_, params] = queryKey;
      const queryParams = new URLSearchParams();
      
      if (params.search) queryParams.set('search', params.search as string);
      if (params.categoryId) queryParams.set('categoryId', params.categoryId as string);
      if (params.status) queryParams.set('status', params.status as string);
      if (params.sort) queryParams.set('sort', params.sort as string);
      if (params.order) queryParams.set('order', params.order as string);
      
      const res = await fetch(`/api/links?${queryParams.toString()}`, {
        credentials: "include"
      });
      
      if (!res.ok) {
        throw new Error(`Error fetching links: ${res.statusText}`);
      }
      
      return res.json();
    },
    enabled: !!user
  });
  
  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: !!user,
  });
  
  // Fetch tags
  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["/api/tags"],
    enabled: !!user,
  });
  
  // Clipboard detection
  const { detectedUrl, showNotification, dismissNotification } = useClipboard({
    enabled: !!user,
  });
  
  // Add link mutation for clipboard detection
  const addLinkMutation = useMutation({
    mutationFn: async (linkData: Partial<InsertLink>) => {
      const res = await apiRequest("POST", "/api/links", linkData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Link saved",
        description: "The link has been successfully saved",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
      dismissNotification();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save link",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete link mutation
  const deleteLinkMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/links/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Link deleted",
        description: "The link has been successfully deleted",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete link",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle saving link from clipboard notification
  const handleSaveClipboardLink = (linkData: Partial<InsertLink>) => {
    addLinkMutation.mutate(linkData);
  };
  
  // Handle edit link
  const handleEditLink = (link: Link) => {
    setSelectedLink(link);
    setIsEditLinkOpen(true);
  };
  
  // Handle delete link
  const handleDeleteLink = (id: number) => {
    const link = links.find(link => link.id === id);
    if (link) {
      setSelectedLink(link);
      setIsDeleteDialogOpen(true);
    }
  };
  
  // Handle confirming delete
  const confirmDelete = () => {
    if (selectedLink) {
      deleteLinkMutation.mutate(selectedLink.id);
    }
  };
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    queryClient.invalidateQueries({ 
      queryKey: ["/api/links", { search: searchQuery, categoryId, status, sort, order }] 
    });
  };
  
  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setCategoryId("");
    setStatus("");
    setSort("createdAt");
    setOrder("desc");
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileMenu />
      
      <main className="flex-1 overflow-y-auto bg-gray-50 pt-0 md:pt-0">
        <div className="px-4 md:px-8 py-6 mt-12 md:mt-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 md:mb-0">All Links</h1>
            
            <div className="flex items-center">
              <form onSubmit={handleSearch} className="relative mr-2 w-full md:w-64">
                <Input 
                  type="text" 
                  placeholder="Search links..." 
                  className="w-full pr-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7 w-7 p-0"
                >
                  <FontAwesomeIcon icon="search" className="text-gray-400" />
                </Button>
              </form>
              <Button 
                onClick={() => setIsAddLinkOpen(true)}
                className="whitespace-nowrap"
              >
                <FontAwesomeIcon icon="plus" className="mr-1" /> Add Link
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Applied">Applied</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Date Added</SelectItem>
                      <SelectItem value="deadline">Deadline</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                  <Select value={order} onValueChange={setOrder}>
                    <SelectTrigger>
                      <SelectValue placeholder="Order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Descending</SelectItem>
                      <SelectItem value="asc">Ascending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button variant="outline" onClick={resetFilters}>
                    Reset Filters
                  </Button>
                </div>
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <div>
                  {(categoryId || status || searchQuery) && (
                    <div className="flex flex-wrap gap-2">
                      {categoryId && (
                        <Badge variant="secondary" className="flex items-center space-x-1">
                          <span>Category: {categories.find(c => c.id.toString() === categoryId)?.name}</span>
                          <button onClick={() => setCategoryId("")} className="ml-1">×</button>
                        </Badge>
                      )}
                      {status && (
                        <Badge variant="secondary" className="flex items-center space-x-1">
                          <span>Status: {status}</span>
                          <button onClick={() => setStatus("")} className="ml-1">×</button>
                        </Badge>
                      )}
                      {searchQuery && (
                        <Badge variant="secondary" className="flex items-center space-x-1">
                          <span>Search: {searchQuery}</span>
                          <button onClick={() => setSearchQuery("")} className="ml-1">×</button>
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <FontAwesomeIcon icon="grip" className="mr-1" /> Grid
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <FontAwesomeIcon icon="list" className="mr-1" /> List
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Links Grid/List */}
          {isLoadingLinks ? (
            <div className="flex justify-center items-center py-12">
              <FontAwesomeIcon icon="spinner" className="animate-spin text-primary text-2xl" />
            </div>
          ) : links.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <FontAwesomeIcon icon="link" className="text-gray-300 text-4xl mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No links found</h3>
              <p className="text-gray-500 mb-4">
                {categoryId || status || searchQuery 
                  ? "Try adjusting your filters or search query."
                  : "Start by adding your first link."}
              </p>
              <Button onClick={() => setIsAddLinkOpen(true)}>
                <FontAwesomeIcon icon="plus" className="mr-1" /> Add Link
              </Button>
            </div>
          ) : (
            <div className={viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
              : "space-y-4"
            }>
              {links.map(link => {
                // Find category
                const category = categories.find(cat => cat.id === link.categoryId);
                
                // Find tags for this link
                const linkTags = tags.filter(tag => 
                  // This is a placeholder - in a real implementation, we'd have the relationship data
                  // Instead, we're just providing empty tags for now
                  false
                );
                
                return (
                  <LinkCard 
                    key={link.id} 
                    link={link} 
                    categoryName={category?.name}
                    tags={linkTags}
                    onEdit={handleEditLink}
                    onDelete={handleDeleteLink}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>
      
      {/* Add/Edit Link Dialog */}
      {isAddLinkOpen && (
        <AddLinkForm 
          isOpen={isAddLinkOpen} 
          onClose={() => setIsAddLinkOpen(false)} 
        />
      )}
      
      {isEditLinkOpen && selectedLink && (
        <AddLinkForm 
          isOpen={isEditLinkOpen} 
          onClose={() => setIsEditLinkOpen(false)}
          initialData={selectedLink}
          isEdit={true}
        />
      )}
      
      {/* Delete Link Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Link</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedLink?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLinkMutation.isPending && (
                <FontAwesomeIcon icon="spinner" className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Clipboard Notification */}
      {detectedUrl && (
        <ClipboardNotification
          url={detectedUrl}
          isVisible={showNotification}
          onDismiss={dismissNotification}
          onSave={handleSaveClipboardLink}
          categories={categories}
        />
      )}
    </div>
  );
}
