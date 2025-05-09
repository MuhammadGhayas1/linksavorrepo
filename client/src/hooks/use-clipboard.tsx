import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseClipboardOptions {
  enabled?: boolean;
  onUrlDetected?: (url: string) => void;
}

// Regular expression to match URLs
// This is a simple regex, can be expanded for more robust URL validation
const URL_REGEX = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;

export function useClipboard({ enabled = true, onUrlDetected }: UseClipboardOptions = {}) {
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const { toast } = useToast();

  const isValidUrl = useCallback((text: string): boolean => {
    return URL_REGEX.test(text);
  }, []);

  const checkClipboard = useCallback(async () => {
    if (!enabled) return;
    
    try {
      // Check if clipboard API is available
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        console.warn("Clipboard API not available");
        return;
      }
      
      // Read from clipboard
      const text = await navigator.clipboard.readText();
      
      // Check if it's a valid URL
      if (text && isValidUrl(text) && text !== detectedUrl) {
        setDetectedUrl(text);
        setShowNotification(true);
        if (onUrlDetected) {
          onUrlDetected(text);
        }
      }
    } catch (error) {
      console.error("Failed to read clipboard:", error);
    }
  }, [enabled, detectedUrl, isValidUrl, onUrlDetected]);

  // Check when window gets focus
  useEffect(() => {
    if (!enabled) return;
    
    const handleFocus = () => {
      checkClipboard();
    };
    
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [enabled, checkClipboard]);

  // Ask for permission once when enabled
  useEffect(() => {
    if (enabled && navigator.clipboard) {
      // Try to read clipboard to prompt permission
      navigator.clipboard.readText().catch(() => {
        // This will typically fail if permission is not granted
        toast({
          title: "Clipboard Permission",
          description: "Please allow clipboard access for smart link detection",
        });
      });
    }
  }, [enabled, toast]);

  const dismissNotification = useCallback(() => {
    setShowNotification(false);
  }, []);

  return {
    detectedUrl,
    showNotification,
    dismissNotification,
    checkClipboard
  };
}
