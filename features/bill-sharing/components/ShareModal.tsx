"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2Icon, CopyIcon, ShareIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

interface ShareModalProps {
  url: string;
  onShare: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isSaving: boolean;
  setIsSaving: (isSaving: boolean) => void;
}

export default function ShareModal({
  url,
  onShare,
  isOpen,
  setIsOpen,
  isSaving,
}: ShareModalProps) {
  const [canNativeShare, setCanNativeShare] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if the Web Share API is available
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const handleCopy = () => {
    if (inputRef.current) {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "Tabulate",
          text: "View your tab split results!",
          url: url,
        })
        .then(() => {
          setIsOpen(false);
        })
        .catch((error) => {
          console.error("Error sharing:", error);
        });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={() => {
            onShare();
          }}
        >
          <Share2Icon className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this tab</DialogTitle>
          <DialogDescription>
            Anyone with the link can view this tab
          </DialogDescription>
        </DialogHeader>

        {isSaving ? (
          <div className="flex items-center justify-center h-20">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div>
            <div className="flex items-center space-x-2 mt-4">
              <div className="grid flex-1 gap-2">
                <Input ref={inputRef} readOnly value={url} className="w-full" />
              </div>
              <Button variant="outline" size="icon" onClick={handleCopy}>
                <CopyIcon className="h-4 w-4" />
              </Button>
            </div>
            {canNativeShare && (
              <Button className="w-full mt-4" onClick={handleNativeShare}>
                <ShareIcon className="h-4 w-4 mr-2" />
                Share via device
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
