import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isYesterday, differenceInDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format a date for displaying (with relative terms for recent dates)
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(dateObj)) {
    return `Today, ${format(dateObj, 'h:mm a')}`;
  }
  
  if (isYesterday(dateObj)) {
    return `Yesterday, ${format(dateObj, 'h:mm a')}`;
  }
  
  return format(dateObj, 'MMM d, yyyy');
}

// Format a deadline with days remaining
export function formatDeadline(deadline: Date | string | null | undefined): { text: string; className: string } {
  if (!deadline) {
    return { text: 'No deadline', className: 'text-gray-500' };
  }
  
  const dateObj = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const today = new Date();
  const daysLeft = differenceInDays(dateObj, today);
  
  // If the deadline is in the past
  if (daysLeft < 0) {
    return { text: 'Expired', className: 'text-gray-400' };
  }
  
  // If the deadline is today
  if (daysLeft === 0) {
    return { text: 'Today', className: 'text-red-500 font-medium' };
  }
  
  // If the deadline is in 1-3 days
  if (daysLeft <= 3) {
    return { text: `${daysLeft} days left`, className: 'text-red-500 font-medium' };
  }
  
  // If the deadline is in 4-7 days
  if (daysLeft <= 7) {
    return { text: `${daysLeft} days left`, className: 'text-orange-500 font-medium' };
  }
  
  // If the deadline is more than 7 days away
  return { text: `${daysLeft} days left`, className: 'text-blue-500 font-medium' };
}

// Extract hostname from URL
export function getHostname(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch (e) {
    return url;
  }
}

// Get appropriate icon for a link category
export const categoryIcons: Record<string, { icon: string; bgColor: string; textColor: string }> = {
  "Scholarship": { 
    icon: "fa-graduation-cap", 
    bgColor: "bg-blue-100", 
    textColor: "text-blue-500" 
  },
  "Job": { 
    icon: "fa-briefcase", 
    bgColor: "bg-purple-100", 
    textColor: "text-purple-500" 
  },
  "Course": { 
    icon: "fa-book", 
    bgColor: "bg-green-100", 
    textColor: "text-green-500" 
  },
  "Article": { 
    icon: "fa-newspaper", 
    bgColor: "bg-yellow-100", 
    textColor: "text-yellow-500" 
  },
  "Event": { 
    icon: "fa-calendar", 
    bgColor: "bg-red-100", 
    textColor: "text-red-500" 
  },
  "Research": { 
    icon: "fa-microscope", 
    bgColor: "bg-indigo-100", 
    textColor: "text-indigo-500" 
  },
  "Conference": { 
    icon: "fa-users", 
    bgColor: "bg-pink-100", 
    textColor: "text-pink-500" 
  },
  "Tool": { 
    icon: "fa-tools", 
    bgColor: "bg-gray-100", 
    textColor: "text-gray-500" 
  },
  "Other": { 
    icon: "fa-link", 
    bgColor: "bg-gray-100", 
    textColor: "text-gray-500" 
  }
};

// Get a category display with icon and color
export function getCategoryDisplay(categoryName: string | undefined | null) {
  if (!categoryName) {
    return categoryIcons["Other"];
  }
  
  return categoryIcons[categoryName] || categoryIcons["Other"];
}
