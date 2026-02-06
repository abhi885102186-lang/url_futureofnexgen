
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { User, Mic, MicOff, Loader2, Send, X, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { voiceBasedAssistant } from "@/ai/flows/voice-based-assistant";
import { textToSpeech } from "@/ai/flows/text-to-speech";
import { VoiceIcon } from "./voice-icon";
import { Input } from "../ui/input";
import { Logo } from "../logo";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";


type VoiceMessage = {
  role: "user" | "model";
  content: string;
};

const useSpeechRecognition = (
  onResult: (transcript: string) => void,
  onFinalResult: (transcript: string) => void,
  onInterrupt: () => void,
  isSpeaking: boolean
) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();
  const shouldBeListeningRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        variant: "destructive",
        title: "Browser not supported",
        description: "Speech recognition is not supported by your browser.",
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    // By not setting `lang`, we allow the browser to use its default,
    // which is often more flexible for multilingual users.

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript.toLowerCase().trim();

        if (isSpeaking) {
          if (transcript === 'stop' || transcript === 'silence') {
            onInterrupt();
            if(recognitionRef.current) {
                recognitionRef.current.stop();
            }
            return; 
          }
        }

        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      onResult(interimTranscript);
      if (finalTranscript && !isSpeaking) {
        onFinalResult(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'aborted' || event.error === 'no-speech') {
        return;
      }
      console.error("Speech recognition error:", event.error);
      toast({
        variant: "destructive",
        title: "Speech Recognition Error",
        description: "An error occurred during speech recognition.",
      });
      shouldBeListeningRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (shouldBeListeningRef.current) {
        try {
          recognition.start();
          setIsListening(true);
        } catch (e) {
          console.error("Error restarting speech recognition:", e);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldBeListeningRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onResult, onFinalResult, toast, onInterrupt, isSpeaking]);

  const startListening = useCallback(() => {
    if (!isListening && recognitionRef.current) {
      try {
        shouldBeListeningRef.current = true;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Error starting recognition:", err);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      shouldBeListeningRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  return { isListening, startListening, stopListening };
};

export default function VoiceConversationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  
  const addMessage = (message: VoiceMessage) => {
    setMessages((prev) => [...prev, message]);
  };
  
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const handleInterrupt = useCallback(() => {
    stopAudio();
  }, [stopAudio]);

  const speak = useCallback(async (text: string, startListeningFn: () => void) => {
    stopAudio();
    setIsSpeaking(true);

    const finishSpeaking = () => {
      setIsSpeaking(false);
      if(isOpen) {
        startListeningFn();
      }
    };
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      
      const setVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        let detectedLang = 'en'; // Default
        if (text.match(/[\u0900-\u097F]/)) { // Basic check for Hindi characters
            detectedLang = 'hi';
        }

        let bestVoice = voices.find(voice => voice.lang.startsWith(detectedLang));
        if (!bestVoice) bestVoice = voices.find(voice => voice.lang.startsWith('en')); // Fallback to English

        if (bestVoice) utterance.voice = bestVoice;
      }

      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = setVoice;
      } else {
        setVoice();
      }

      utterance.onend = finishSpeaking;
      utterance.onerror = (e) => {
        console.error("Web Speech API error:", e);
        toast({ variant: "destructive", title: "Speech Error", description: "Could not play audio locally."});
        finishSpeaking();
      }
      window.speechSynthesis.speak(utterance);
      return;
    }

    try {
      const { audioDataUri } = await textToSpeech({ text });
      if (audioDataUri && isOpen) {
        const audio = new Audio(audioDataUri);
        audioRef.current = audio;
        audio.play();
        audio.onended = finishSpeaking;
        audio.onerror = () => {
           toast({ variant: "destructive", title: "Audio Error", description: "Could not play AI response audio."});
           finishSpeaking();
        }
      } else {
        finishSpeaking();
      }
    } catch (error) {
      console.error("TTS error:", error);
      toast({
        variant: "destructive",
        title: "Audio Error",
        description: "Could not get AI response audio.",
      });
      finishSpeaking();
    }
  }, [toast, stopAudio, isOpen]);
    
  const { isListening, startListening, stopListening } = useSpeechRecognition(
    setInterimTranscript,
    (transcript: string) => {
      if (!transcript.trim()) return;
      if (transcript.trim().toLowerCase() === "stop") {
          setIsOpen(false);
          return;
      }
      setInterimTranscript("");
      processUserMessage(transcript);
    },
    handleInterrupt,
    isSpeaking
  );
  
  const processUserMessage = useCallback(async (message: string) => {
     if (!message.trim()) return;
    
    addMessage({ role: "user", content: message });
    setIsProcessing(true);

    try {
      const history = messages.map(m => ({role: m.role, content: m.content}));
      const result = await voiceBasedAssistant({ voiceCommand: message, history });
      const aiResponse = result.responseText;
      
      addMessage({ role: "model", content: aiResponse });
      await speak(aiResponse, startListening);

    } catch (error) {
      console.error("AI error:", error);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Could not get a response from the assistant.",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [messages, speak, toast, startListening]);

  useEffect(() => {
    if (isOpen) {
      setMessages([]); 
      checkMicPermissionAndStart();
    } else {
      stopListening();
      stopAudio();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const checkMicPermissionAndStart = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      startListening();
    } catch (error) {
      console.error("Microphone access denied:", error);
      toast({
        variant: "destructive",
        title: "Microphone Access Denied",
        description: "Please allow microphone access to use voice chat.",
      });
      setIsOpen(false);
    }
  };

  const handleMicClick = () => {
    if (isSpeaking) {
      stopAudio();
      return;
    }
    if (!isListening) {
      checkMicPermissionAndStart();
    }
  };
  

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <VoiceIcon />
          <span className="sr-only">Voice Conversation</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg h-[70vh] flex flex-col p-0 overflow-hidden bg-background">
        <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute top-0 left-0 w-full h-full object-cover -z-10"
        >
            <source src="/background-video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-black/50 -z-10" />

        <div className="relative z-10 flex flex-col h-full">
            <DialogHeader className="p-6 pb-2 text-white">
              <DialogTitle className="font-headline flex items-center gap-2">
                <VoiceIcon /> Voice Conversation
              </DialogTitle>
              <DialogDescription className="text-gray-300">
                Talk directly with the Nexus Assistant. Say "stop" or "silence" to interrupt.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 flex flex-col items-center justify-end p-6 pb-12 text-center">
                 <p className="text-white text-lg h-8 mb-4">
                    {interimTranscript 
                        ? <span className="italic">{interimTranscript}</span>
                        : (isListening ? 'Listening...' : '')
                    }
                </p>
                <div className="mt-8">
                    <Button
                        size="icon"
                        onClick={handleMicClick}
                        className={cn(
                          "rounded-full h-14 w-14 bg-primary/20 text-primary-foreground hover:bg-primary/30 transition-all duration-300",
                          isListening && "bg-destructive/50 animate-pulse",
                          isSpeaking && "bg-green-500/50"
                        )}
                        disabled={isProcessing && !isSpeaking}
                    >
                        {isProcessing ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : isSpeaking ? (
                          <Volume2 className="h-5 w-5" />
                        ) : (
                          <Mic className="h-5 w-5" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

    