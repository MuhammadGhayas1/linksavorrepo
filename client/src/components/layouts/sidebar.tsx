import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Category } from "@shared/schema";
import { cn } from "@/lib/utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: !!user,
  });

  return (
    <aside className={cn("w-64 bg-white border-r border-gray-200 shrink-0 hidden md:flex flex-col h-full", className)}>
      <div className="flex flex-col h-full">
        <div className="px-6 py-5 flex items-center border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center mr-2">
              <FontAwesomeIcon icon="link-slash" className="text-white text-lg" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Link Savor</h1>
          </div>
        </div>
        
        <div className="px-4 pt-5 pb-3">
          {user && (
            <div className="flex items-center mb-4 px-2">
              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                <span className="text-gray-700 font-medium">
                  {user.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">{user.name}</h3>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
          )}
          
          <div className="space-y-1">
            <Link href="/">
              <a className={cn(
                "flex items-center px-2 py-2 text-sm font-medium rounded-md", 
                location === "/" 
                  ? "bg-blue-50 text-primary" 
                  : "text-gray-600 hover:bg-gray-50"
              )}>
                <FontAwesomeIcon icon="house" className="w-5 h-5 mr-2" />
                <span>Dashboard</span>
              </a>
            </Link>
            
            <Link href="/links">
              <a className={cn(
                "flex items-center px-2 py-2 text-sm font-medium rounded-md", 
                location === "/links" 
                  ? "bg-blue-50 text-primary" 
                  : "text-gray-600 hover:bg-gray-50"
              )}>
                <FontAwesomeIcon icon="bookmark" className="w-5 h-5 mr-2" />
                <span>All Links</span>
              </a>
            </Link>
            
            {/* Tags will be added in future versions */}
            <Link href="/tags">
              <a className={cn(
                "flex items-center px-2 py-2 text-sm font-medium rounded-md", 
                location === "/tags" 
                  ? "bg-blue-50 text-primary" 
                  : "text-gray-600 hover:bg-gray-50"
              )}>
                <FontAwesomeIcon icon="tag" className="w-5 h-5 mr-2" />
                <span>Tags</span>
              </a>
            </Link>
          </div>
        </div>
        
        <div className="px-4 py-3 border-t border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Categories</h3>
            <Button variant="ghost" size="sm" className="h-5 text-primary hover:text-blue-700">
              <FontAwesomeIcon icon="plus" className="h-3 w-3" />
            </Button>
          </div>
          
          {categories.map(category => (
            <Link key={category.id} href={`/links?category=${category.id}`}>
              <a className="flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 group">
                <FontAwesomeIcon 
                  icon={category.icon as any || "link"} 
                  className="w-5 h-5 mr-2 text-blue-400" 
                />
                <span>{category.name}</span>
              </a>
            </Link>
          ))}
        </div>
        
        <div className="mt-auto px-4 py-4">
          <Link href="/profile">
            <a className={cn(
              "flex items-center px-2 py-2 text-sm font-medium rounded-md", 
              location === "/profile" 
                ? "bg-blue-50 text-primary" 
                : "text-gray-600 hover:bg-gray-50"
            )}>
              <FontAwesomeIcon icon="gear" className="w-5 h-5 mr-2" />
              <span>Settings</span>
            </a>
          </Link>
          
          <button 
            onClick={() => logoutMutation.mutate()}
            className="w-full flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50"
          >
            <FontAwesomeIcon icon="arrow-up-right-from-square" className="w-5 h-5 mr-2" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
