
'use client';

import {
  useState,
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { User, Volume2, Languages, Loader2, FileText, Users, FolderKanban, Settings, History, ArrowRight, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import ChatFooter from './chat-footer';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { marked } from 'marked';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { translateText } from '@/ai/flows/translate-text';
import { chat } from '@/ai/flows/chat';
import { analyzeUploadedImage } from '@/ai/flows/analyze-uploaded-image';
import { analyzeDocument } from '@/ai/flows/analyze-uploaded-document';
import { analyzeUploadedPdf } from '@/ai/flows/analyze-uploaded-pdf';
import { generateImage } from '@/ai/flows/generate-image';
import Image from 'next/image';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Logo } from '../logo';
import useChatHistory, { Conversation } from '@/hooks/use-chat-history';

export type Message = {
  sender: 'user' | 'ai';
  text: string;
  image?: string;
  document?: { name: string; dataUri: string, textContent: string };
};

type ChatContextType = {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  sendSuggestion: (suggestion: string) => void;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  appendMessage: (message: Message) => void;
  handleSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    message?: string,
    image?: string
  ) => Promise<void>;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

const getYouTubeVideoId = (url: string) => {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
    if (urlObj.hostname.includes('youtube.com')) {
      const videoId = urlObj.searchParams.get('v');
      if (videoId) {
        return videoId;
      }
    }
  } catch (error) {
    // Not a valid URL, ignore
  }
  return null;
};

const AiMessageActions = ({ message }: { message: Message }) => {
  const { toast } = useToast();
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { sendSuggestion } = useChat();

  useEffect(() => {
    // Cleanup for both audio element and speech synthesis
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleTranslate = async () => {
    if (translatedText) {
      // Revert to original if already translated
      setTranslatedText(null);
      setAudioDataUri(null); // Invalidate audio cache
      return;
    }

    setIsTranslating(true);
    try {
      const result = await translateText({
        text: message.text,
        targetLanguage: 'hi',
      });
      setTranslatedText(result.translatedText);
      setAudioDataUri(null); // Invalidate audio cache for the new text
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        variant: 'destructive',
        title: 'Translation failed',
        description: 'Could not translate the message.',
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handlePlayAudio = async () => {
    const textToSpeak = translatedText || message.text;

    // Stop any currently playing audio/speech
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return; // If it was speaking, the goal is to stop it.
    }

    setIsSpeaking(true);

    // Use Web Speech API if available (much faster and works offline)
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      
      const setVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        let femaleVoice = voices.find(voice => voice.name === 'Google UK English Female');
        if (!femaleVoice) femaleVoice = voices.find(voice => voice.name === 'Samantha');
        if (!femaleVoice) femaleVoice = voices.find(voice => voice.lang.startsWith('en') && voice.name.toLowerCase().includes('female'));
        if (femaleVoice) utterance.voice = femaleVoice;
      }

      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = setVoice;
      } else {
        setVoice();
      }
      
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (e) => {
        console.error('Speech synthesis error:', e);
        toast({
          variant: 'destructive',
          title: 'Audio failed',
          description: 'Could not play audio using the browser\'s speech synthesis.',
        });
        setIsSpeaking(false);
      };
      window.speechSynthesis.speak(utterance);
      return;
    }

    // Fallback to Genkit TTS if Web Speech API is not available or if cached audio exists
    if (audioDataUri) {
      const newAudio = new Audio(audioDataUri);
      audioRef.current = newAudio;
      newAudio.play();
      newAudio.onended = () => setIsSpeaking(false);
      return;
    }
    
    try {
      const result = await textToSpeech({ text: textToSpeak });
      if (result.audioDataUri) {
        setAudioDataUri(result.audioDataUri);
        const newAudio = new Audio(result.audioDataUri);
        audioRef.current = newAudio;
        newAudio.play();
        newAudio.onended = () => setIsSpeaking(false);
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error('Text-to-speech error:', error);
      toast({
        variant: 'destructive',
        title: 'Audio failed',
        description: 'Could not generate audio for the message. You may have hit a rate limit.',
      });
      setIsSpeaking(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setIsCopied(true);
    toast({ title: 'Copied to clipboard' });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const currentText = translatedText || message.text;
  const suggestions = currentText.match(/Suggestions:\n(1\..*)\n(2\..*)\n(3\..*)/);
  let suggestionList: string[] = [];
  if(suggestions) {
    suggestionList = suggestions.slice(1).map(s => s.substring(3).trim());
  }

  const renderer = useMemo(() => {
    const r = new marked.Renderer();
    r.link = (href, title, text) => {
      const videoId = getYouTubeVideoId(href);
      if (videoId) {
        return `
          <div class="my-2 aspect-video">
             <iframe 
                class="w-full h-full rounded-md"
                src="https://www.youtube.com/embed/${videoId}" 
                title="${title || text}" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowfullscreen>
             </iframe>
          </div>`;
      }
      // Ensure links open in a new tab
      return `<a href="${href}" title="${title || ''}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    };
    r.code = (code, language) => {
      const lang = language || 'plaintext';
      return `
        <div class="my-2 bg-code-background rounded-lg overflow-hidden font-code">
          <div class="flex justify-between items-center bg-muted/30 py-1.5 px-4 text-xs">
            <span class="text-muted-foreground">${lang}</span>
            <button class="copy-code-btn flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              <span class="copy-text">Copy code</span>
            </button>
          </div>
          <pre class="text-white p-4 text-sm overflow-x-auto"><code>${code}</code></pre>
        </div>
      `;
    };
    return r;
  }, []);

  const renderedHtml = useMemo(() => {
      const html = marked(currentText.replace(/Suggestions:\n(1\..*\n?)(2\..*\n?)(3\..*\n?)/, ''), { renderer });
      // DOMPurify would be great here if available, for now, we trust the AI source.
      const safeHtml = html;

      // Manually find and attach event listeners after render
      // This is a workaround because React's dangerouslySetInnerHTML doesn't handle event listeners.
      setTimeout(() => {
        document.querySelectorAll('.copy-code-btn').forEach(button => {
          // A bit of a hack to prevent multiple listeners
          if ((button as any).__listenerAttached) return;

          const handleClick = () => {
            const pre = button.closest('.bg-code-background')?.querySelector('pre');
            const code = pre?.querySelector('code');
            if (code) {
              navigator.clipboard.writeText(code.innerText);
              const copyText = button.querySelector('.copy-text');
              if (copyText) {
                copyText.textContent = 'Copied!';
              }
              button.innerHTML = button.innerHTML.replace('lucide-copy', 'lucide-check');
              
              setTimeout(() => {
                if (copyText) {
                  copyText.textContent = 'Copy code';
                }
                button.innerHTML = button.innerHTML.replace('lucide-check', 'lucide-copy');
              }, 2000);
            }
          };
          button.addEventListener('click', handleClick);
          (button as any).__listenerAttached = true;
        });
      }, 0);

      return safeHtml;
  }, [currentText, renderer]);


  return (
    <div>
       <div
        className="prose dark:prose-invert max-w-full"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      ></div>

      {suggestionList.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-semibold mb-2">Suggestions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestionList.map((suggestion, i) => (
              <Button key={i} variant="outline" size="sm" onClick={() => sendSuggestion(suggestion)}>
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex items-center gap-2 mt-3 text-muted-foreground">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          className="h-7 w-7"
        >
          {isCopied ? <Check className="text-primary" /> : <Copy />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePlayAudio}
          disabled={isTranslating}
          className="h-7 w-7"
        >
          {isSpeaking ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Volume2 className={cn(isSpeaking && 'text-primary')} />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleTranslate}
          disabled={isTranslating}
          className="h-7 w-7"
        >
          {isTranslating ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Languages className={cn(translatedText && 'text-primary')} />
          )}
        </Button>
      </div>
    </div>
  );
};


export default function ChatView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [documentPreview, setDocumentPreview] = useState<{name: string, dataUri: string, textContent: string} | null>(null);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationId = searchParams.get('id');
  const { saveConversation, getConversation, isLoaded } = useChatHistory();
  
  const currentConversation = useMemo(() => {
    return conversationId ? getConversation(conversationId) : null;
  }, [conversationId, getConversation]);

  // Effect to load or reset chat based on conversationId
  useEffect(() => {
    if (isLoaded) {
      if (currentConversation) {
        setMessages(currentConversation.messages);
      } else if (conversationId) {
        // If ID is in URL but not found, redirect to new chat
        router.replace('/dashboard');
      } else {
        setMessages([]);
      }
    }
  }, [conversationId, isLoaded, currentConversation, router]);

  // Effect to scroll to bottom on new messages
  useEffect(() => {
    if (scrollViewportRef.current) {
        scrollViewportRef.current.scrollTo({
          top: scrollViewportRef.current.scrollHeight,
          behavior: 'smooth',
        });
    }
  }, [messages]);

  const appendMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  const handleFinalMessages = (finalMessages: Message[]) => {
    const newId = saveConversation(finalMessages, conversationId);
    if (!conversationId && newId) {
      router.replace(`/dashboard?id=${newId}`);
    }
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    message?: string,
  ) => {
    e.preventDefault();
    const userMessage = message || inputValue;
    if (!userMessage.trim() || isLoading) return;

    const userImage = imagePreview;
    const userDocument = documentPreview;

    const newUserMessage: Message = { sender: 'user', text: userMessage, image: userImage || undefined, document: userDocument || undefined };
    const newMessages = [...messages, newUserMessage];
    
    setMessages(newMessages);
    setInputValue('');
    setImagePreview(null);
    setDocumentPreview(null);
    setIsLoading(true);

    try {
      let aiMessage: Message;
      const imagePromptRegex = /^(create|generate|draw)\s+(an?|the)?\s*image\s+(of|depicting)?/i;
      const isImagePrompt = imagePromptRegex.test(userMessage);

      if (userImage) {
        const imageResult = await analyzeUploadedImage({
          imageDataUri: userImage,
          prompt: userMessage,
        });
        aiMessage = { sender: 'ai', text: imageResult.analysisResult };
      } else if (userDocument) {
        // If text was extracted, use the text-based flow
        if (userDocument.textContent) {
          const docResult = await analyzeDocument({
            documentTextContent: userDocument.textContent,
            prompt: userMessage
          });
          aiMessage = { sender: 'ai', text: docResult.analysis };
        } else {
          // If no text content (i.e., it's a PDF), use the PDF-specific flow
          const pdfResult = await analyzeUploadedPdf({
            pdfDataUri: userDocument.dataUri,
            prompt: userMessage
          });
          aiMessage = { sender: 'ai', text: pdfResult.analysis };
        }
      } else if (isImagePrompt) {
        const prompt = userMessage.replace(imagePromptRegex, '').trim();
        const imageResult = await generateImage({ prompt });
        aiMessage = { 
          sender: 'ai', 
          text: `Here is the image you requested for: "${prompt}"`,
          image: imageResult.imageDataUri 
        };
      } else {
        const history = newMessages.slice(0, -1).map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            content: msg.text
        }));
        const result = await chat({ prompt: userMessage, history });
        aiMessage = { sender: 'ai', text: result };
      }

      const finalMessages = [...newMessages, aiMessage];
      setMessages(finalMessages);
      handleFinalMessages(finalMessages);

    } catch (error) {
      console.error('AI chat error:', error);
      const errorMessage: Message = {
        sender: 'ai',
        text: 'Sorry, something went wrong. Please try again.',
      };
      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
      handleFinalMessages(finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const sendSuggestion = async (suggestion: string) => {
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
    await handleSubmit(fakeEvent, suggestion);
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        setMessages,
        sendSuggestion,
        isLoading,
        setIsLoading,
        appendMessage,
        handleSubmit,
      }}
    >
      <div className="flex h-full flex-col">
        <ScrollArea className="flex-1" viewportRef={scrollViewportRef}>
          {messages.length > 0 ? (
              <div className="max-w-3xl mx-auto space-y-6 p-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-start gap-3',
                      msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {msg.sender === 'ai' && (
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>
                          <Logo className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        'max-w-[75%] rounded-lg p-3 text-sm',
                        msg.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background'
                      )}
                    >
                      {msg.image && (
                        <div className="mb-2 rounded-md overflow-hidden">
                          <Image
                            src={msg.image}
                            alt="User upload"
                            width={300}
                            height={300}
                            className="object-cover"
                          />
                        </div>
                      )}
                      {msg.document && (
                        <div className="mb-2 flex items-center gap-3 rounded-md border p-2">
                           <FileText className="h-6 w-6 text-primary"/>
                           <span className="text-sm font-medium truncate">{msg.document.name}</span>
                        </div>
                      )}
                      {msg.sender === 'user' ? (
                        msg.text
                      ) : (
                        <AiMessageActions message={msg} />
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start gap-3 justify-start">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>
                        <Logo className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg p-3 text-sm">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
          ) : (
            <div className="flex flex-col h-full justify-center items-center">
              <div className="text-center p-4">
                  <Logo className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h2 className="mt-4 text-xl font-semibold font-headline">Welcome to Nexus Assistant</h2>
                  <p className="mt-2 text-muted-foreground">
                      Start a conversation to get help. You can ask questions, upload files, or even generate images.
                  </p>
                  <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
                      <Button variant="outline" onClick={() => sendSuggestion("What can you do?")}>
                          What can you do?
                      </Button>
                      <Button variant="outline" onClick={() => sendSuggestion("Explain quantum computing")}>
                          Explain quantum computing
                      </Button>
                      <Button variant="outline" onClick={() => sendSuggestion("Generate an image of a cat in space")}>
                          Generate an image
                      </Button>
                  </div>
              </div>
            </div>
          )}
        </ScrollArea>
        
        <ChatFooter 
          inputValue={inputValue}
          setInputValue={setInputValue}
          imagePreview={imagePreview}
          setImagePreview={setImagePreview}
          documentPreview={documentPreview}
          setDocumentPreview={setDocumentPreview}
        />
      </div>
    </ChatContext.Provider>
  );
}
