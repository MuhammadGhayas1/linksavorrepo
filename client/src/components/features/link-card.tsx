import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link as LinkType, Tag } from "@shared/schema";
import { 
  formatDeadline, 
  formatDate, 
  getHostname,
  getCategoryDisplay
} from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface LinkCardProps {
  link: LinkType;
  tags?: Tag[];
  onEdit: (link: LinkType) => void;
  onDelete: (id: number) => void;
  categoryName?: string;
}

export function LinkCard({ link, tags = [], onEdit, onDelete, categoryName }: LinkCardProps) {
  const { text: deadlineText, className: deadlineClass } = formatDeadline(link.deadline);
  const category = getCategoryDisplay(categoryName);
  
  return (
    <div className="rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden bg-white">
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded ${category.bgColor} flex items-center justify-center mr-2`}>
              <FontAwesomeIcon icon={category.icon as any} className={category.textColor} />
            </div>
            {categoryName && (
              <span className={`text-xs px-2 py-0.5 ${category.bgColor} ${category.textColor} rounded`}>
                {categoryName}
              </span>
            )}
          </div>
          <div className="flex space-x-1">
            <DropdownMenu>
              <DropdownMenuTrigger className="text-gray-400 hover:text-gray-600 focus:outline-none">
                <FontAwesomeIcon icon="ellipsis-vertical" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Link Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(link)}>
                  <FontAwesomeIcon icon="pen-to-square" className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(link.id)}>
                  <FontAwesomeIcon icon="xmark" className="mr-2 h-4 w-4 text-destructive" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <h3 className="font-medium text-gray-900 leading-tight mb-1">{link.title}</h3>
        <p className="text-xs text-gray-500 mb-2 truncate">{getHostname(link.url)}</p>
        
        {link.description && (
          <div className="text-xs text-gray-600 mb-3 line-clamp-2">
            {link.description}
          </div>
        )}
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.map(tag => (
              <Badge key={tag.id} variant="secondary" className="text-xs">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          {link.deadline ? (
            <div className="flex items-center">
              <FontAwesomeIcon icon="clock" className={`${deadlineClass} mr-1 text-xs`} />
              <span className={`text-xs ${deadlineClass}`}>{deadlineText}</span>
            </div>
          ) : (
            <div className="text-xs text-gray-400">No deadline</div>
          )}
          <div className="text-xs text-gray-500">Added {formatDate(link.createdAt)}</div>
        </div>
      </div>
      
      <div className="border-t border-gray-100 px-4 py-2 bg-gray-50 flex justify-between">
        <button 
          className="text-xs text-gray-600 hover:text-gray-900 focus:outline-none"
          onClick={() => onEdit(link)}
        >
          <FontAwesomeIcon icon="pen-to-square" className="mr-1" /> Edit
        </button>
        <a 
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none"
        >
          <FontAwesomeIcon icon="arrow-up-right-from-square" className="mr-1" /> Visit
        </a>
      </div>
    </div>
  );
}
