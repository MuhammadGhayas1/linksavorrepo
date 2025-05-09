import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getHostname } from "@/lib/utils";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { InsertLink } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface ClipboardNotificationProps {
  url: string;
  isVisible: boolean;
  onDismiss: () => void;
  onSave: (link: Partial<InsertLink>) => void;
  categories: Array<{ id: number, name: string }>;
}

interface UrlMetadata {
  title: string;
  description: string;
  favicon: string;
}

export function ClipboardNotification({ 
  url, 
  isVisible, 
  onDismiss, 
  onSave,
  categories
}: ClipboardNotificationProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  
  // Fetch metadata for the URL
  const { mutate: scrapeUrl, data: metadata, isPending } = useMutation<UrlMetadata>({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/scrape-url", { url });
      return res.json();
    }
  });
  
  // Fetch metadata when the URL changes
  useEffect(() => {
    if (url && isVisible) {
      scrapeUrl();
    }
  }, [url, isVisible, scrapeUrl]);
  
  if (!isVisible) return null;
  
  const handleSave = () => {
    onSave({
      url,
      title: metadata?.title || url,
      description: metadata?.description || "",
      favicon: metadata?.favicon || "",
      categoryId: selectedCategory ? parseInt(selectedCategory) : undefined
    });
  };
  
  return (
    <div className="fixed bottom-8 right-8 z-50">
      <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200 w-80 animate-in fade-in">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-medium text-gray-900">Link Detected</h3>
          <button 
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
            onClick={onDismiss}
          >
            <FontAwesomeIcon icon="xmark" />
          </button>
        </div>
        <p className="text-sm mb-3 text-gray-600">Would you like to save this link to Link Savor?</p>
        <div className="bg-gray-100 p-2 rounded-md mb-3 flex items-center">
          <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center mr-2">
            <FontAwesomeIcon icon="link" className="text-primary" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">
              {isPending ? "Loading..." : metadata?.title || url}
            </p>
            <p className="text-xs text-gray-500 truncate">{getHostname(url)}</p>
          </div>
        </div>
        <div className="mb-3">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full text-sm">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select a category</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onDismiss}
          >
            Dismiss
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave}
          >
            Save Link
          </Button>
        </div>
      </div>
    </div>
  );
}
