
'use client';
import { Send, Loader2, X, FileText, Mic } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import VoiceInteraction from './voice-interaction';
import ImageAnalysis from './image-analysis';
import DocumentAnalysis from './document-analysis';
import { useChat } from './chat-view';
import Image from 'next/image';
import VoiceConversationPanel from './voice-conversation-panel';
import { VoiceIcon } from './voice-icon';
import { SendIcon } from './send-icon';
import { Textarea } from '../ui/textarea';
import { useRef, useEffect } from 'react';

type ChatFooterProps = {
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  imagePreview: string | null;
  setImagePreview: React.Dispatch<React.SetStateAction<string | null>>;
  documentPreview: { name: string; dataUri: string, textContent: string } | null;
  setDocumentPreview: React.Dispatch<React.SetStateAction<{ name: string; dataUri: string, textContent: string } | null>>;
};

export default function ChatFooter({
  inputValue,
  setInputValue,
  imagePreview,
  setImagePreview,
  documentPreview,
  setDocumentPreview,
}: ChatFooterProps) {
  const { handleSubmit, isLoading } = useChat();
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    await handleSubmit(e);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);


  const footerIsDisabled = isLoading;

  return (
    <footer className="z-10 bg-background p-2 md:p-4">
      <div className="relative mx-auto max-w-3xl">
        {imagePreview && (
          <div className="relative w-24 h-24 mb-2 p-1 border rounded-md">
            <Image
              src={imagePreview}
              alt="Image preview"
              layout="fill"
              objectFit="cover"
              className="rounded-md"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={() => setImagePreview(null)}
              disabled={footerIsDisabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        {documentPreview && (
            <div className="relative flex items-center gap-3 mb-2 p-2 border rounded-md max-w-xs">
                <FileText className="h-6 w-6 text-primary flex-shrink-0" />
                <p className="text-sm text-muted-foreground truncate">{documentPreview.name}</p>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full flex-shrink-0"
                    onClick={() => setDocumentPreview(null)}
                    disabled={footerIsDisabled}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        )}
        <form ref={formRef} className="relative flex items-end" onSubmit={handleFormSubmit}>
          <Textarea
            ref={textareaRef}
            rows={1}
            placeholder={"Type your message, or use the icons to interact..."}
            className="w-full resize-none pr-48 text-base max-h-48 overflow-y-auto"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={footerIsDisabled}
          />
          <div className="absolute right-1 bottom-1 flex items-center gap-1">
            <VoiceInteraction setInputValue={setInputValue} />
            <VoiceConversationPanel />
            <ImageAnalysis setImagePreview={setImagePreview} />
            <DocumentAnalysis setDocumentPreview={setDocumentPreview}/>
            <Button
              type="submit"
              size="icon"
              className="h-9 w-9"
              disabled={footerIsDisabled || !inputValue.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <SendIcon className="h-5 w-5" />
              )}
              <span className="sr-only">Send Message</span>
            </Button>
          </div>
        </form>
      </div>
    </footer>
  );
}
