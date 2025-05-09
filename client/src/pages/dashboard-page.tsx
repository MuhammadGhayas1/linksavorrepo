import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useClipboard } from "@/hooks/use-clipboard";
import { Sidebar } from "@/components/layouts/sidebar";
import { MobileMenu } from "@/components/layouts/mobile-menu";
import { LinkCard } from "@/components/features/link-card";
import { AddLinkForm } from "@/components/features/add-link-form";
import { StatsOverview } from "@/components/features/stats-overview";
import { DeadlineCalendar } from "@/components/features/deadline-calendar";
import { ClipboardNotification } from "@/components/features/clipboard-notification";
import { Link, Category, Tag, InsertLink } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Link as WouterLink } from "wouter";
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

interface DashboardData {
  stats: {
    totalLinks: number;
    upcomingDeadlines: number;
    completedLinks: number;
    tagsUsed: number;
  };
  recentLinks: Link[];
  upcomingDeadlineLinks: Link[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
  const [isEditLinkOpen, setIsEditLinkOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  
  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    enabled: !!user,
  });
  
  // Fetch categories for clipboard notification
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: !!user,
  });
  
  // Clipboard detection
  const { detectedUrl, showNotification, dismissNotification, checkClipboard } = useClipboard({
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
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
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
    const link = dashboardData?.recentLinks.find(link => link.id === id) || 
                dashboardData?.upcomingDeadlineLinks.find(link => link.id === id);
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
  
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <FontAwesomeIcon icon="spinner" className="text-primary text-2xl animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileMenu />
      
      <main className="flex-1 overflow-y-auto bg-gray-50 pt-0 md:pt-0">
        <div className="px-4 md:px-8 py-6 mt-12 md:mt-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 md:mb-0">Dashboard</h1>
            
            <div className="flex items-center">
              <div className="relative mr-2 w-full md:w-64">
                <Input 
                  type="text" 
                  placeholder="Search links..." 
                  className="w-full pr-8" 
                />
                <span className="absolute right-3 top-2.5 text-gray-400">
                  <FontAwesomeIcon icon="search" />
                </span>
              </div>
              <Button 
                onClick={() => setIsAddLinkOpen(true)}
                className="whitespace-nowrap"
              >
                <FontAwesomeIcon icon="plus" className="mr-1" /> Add Link
              </Button>
            </div>
          </div>
          
          {/* Stats Overview */}
          {dashboardData && (
            <StatsOverview stats={dashboardData.stats} />
          )}
          
          {/* Deadlines & Calendar */}
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 mb-6">
            {/* Upcoming deadlines (3/7 width) */}
            <div className="lg:col-span-3 bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Upcoming Deadlines</h2>
                <WouterLink href="/links?sort=deadline&order=asc">
                  <a className="text-sm text-primary hover:text-blue-700">View all</a>
                </WouterLink>
              </div>
              
              <div className="space-y-4">
                {dashboardData?.upcomingDeadlineLinks && dashboardData.upcomingDeadlineLinks.length > 0 ? (
                  dashboardData.upcomingDeadlineLinks.map(link => {
                    // Find deadline info
                    const deadline = link.deadline ? new Date(link.deadline) : null;
                    const today = new Date();
                    const daysLeft = deadline 
                      ? Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) 
                      : 0;
                    
                    // Determine badge color based on days left
                    let badgeColor = "bg-blue-500";
                    if (daysLeft <= 3) {
                      badgeColor = "bg-red-500";
                    } else if (daysLeft <= 7) {
                      badgeColor = "bg-orange-500";
                    }
                    
                    // Find category info
                    const category = categories.find(cat => cat.id === link.categoryId);
                    const categoryIcon = category?.icon || "graduation-cap";
                    const categoryBg = category?.name === "Job" 
                      ? "bg-purple-100" 
                      : category?.name === "Course" 
                        ? "bg-green-100" 
                        : "bg-blue-100";
                    const categoryText = category?.name === "Job" 
                      ? "text-purple-500" 
                      : category?.name === "Course" 
                        ? "text-green-500" 
                        : "text-blue-500";
                    
                    return (
                      <div key={link.id} className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                        <div className="relative mr-3">
                          <div className={`w-10 h-10 rounded-md ${categoryBg} flex items-center justify-center`}>
                            <FontAwesomeIcon icon={categoryIcon as any} className={categoryText} />
                          </div>
                          <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${badgeColor} flex items-center justify-center`}>
                            <span className="text-white text-xs font-bold">{daysLeft}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{link.title}</p>
                          <p className="text-xs text-gray-500 truncate">{link.url}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs ${
                            daysLeft <= 3 ? "text-red-500" : 
                            daysLeft <= 7 ? "text-orange-500" : 
                            "text-blue-500"
                          } font-medium`}>
                            {daysLeft} days left
                          </span>
                          <p className="text-xs text-gray-500">
                            {link.deadline ? new Date(link.deadline).toLocaleDateString() : "No deadline"}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FontAwesomeIcon icon="clock" className="text-gray-300 text-4xl mb-2" />
                    <p>No upcoming deadlines</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Calendar widget (4/7 width) */}
            <div className="lg:col-span-4">
              {dashboardData?.upcomingDeadlineLinks && (
                <DeadlineCalendar links={dashboardData.upcomingDeadlineLinks} />
              )}
            </div>
          </div>
          
          {/* Recent Links */}
          <div className="grid grid-cols-1 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Recent Links</h2>
                
                <div className="flex items-center space-x-2">
                  <WouterLink href="/links">
                    <a className="text-sm text-primary hover:text-blue-700">View all</a>
                  </WouterLink>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardData?.recentLinks && dashboardData.recentLinks.length > 0 ? (
                  dashboardData.recentLinks.map(link => {
                    // Find category
                    const category = categories.find(cat => cat.id === link.categoryId);
                    
                    return (
                      <LinkCard 
                        key={link.id} 
                        link={link} 
                        categoryName={category?.name}
                        onEdit={handleEditLink}
                        onDelete={handleDeleteLink}
                      />
                    );
                  })
                ) : (
                  <div className="col-span-3 text-center py-12 text-gray-500">
                    <FontAwesomeIcon icon="link" className="text-gray-300 text-4xl mb-2" />
                    <p className="mb-4">No links yet</p>
                    <Button onClick={() => setIsAddLinkOpen(true)}>
                      <FontAwesomeIcon icon="plus" className="mr-2" /> Add Your First Link
                    </Button>
                  </div>
                )}
              </div>
              
              {dashboardData?.recentLinks && dashboardData.recentLinks.length > 0 && (
                <div className="mt-4 text-center">
                  <WouterLink href="/links">
                    <a className="text-sm text-primary hover:text-blue-700">
                      View All Links <FontAwesomeIcon icon="arrow-right" className="ml-1" />
                    </a>
                  </WouterLink>
                </div>
              )}
            </div>
          </div>
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
