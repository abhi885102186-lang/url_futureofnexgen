
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type VoiceInteractionProps = {
  setInputValue: (value: string) => void;
};

// Hook for Speech Recognition
const useSpeechRecognition = (onResult: (transcript: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef("");
  const { toast } = useToast();

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

    recognition.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      onResult(finalTranscriptRef.current + interimTranscript);
    };

    recognition.onerror = (event) => {
       if (event.error === 'aborted' || event.error === 'no-speech') {
        return;
      }
      console.error("Speech recognition error:", event.error);
       toast({
        variant: "destructive",
        title: "Speech Recognition Error",
        description: event.error === 'no-speech' ? "No speech detected." : "An error occurred during speech recognition.",
      });
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognitionRef.current?.stop();
    };
  }, [onResult, toast]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      finalTranscriptRef.current = ""; // Reset transcript on new start
      recognitionRef.current?.start();
    }
    setIsListening((prev) => !prev);
  }, [isListening]);

  return { isListening, toggleListening };
};

export default function VoiceInteraction({ setInputValue }: VoiceInteractionProps) {
  const { toast } = useToast();

  const handleVoiceResult = useCallback((transcript: string) => {
      setInputValue(transcript);
    }, [setInputValue]);

  const { isListening, toggleListening } = useSpeechRecognition(handleVoiceResult);
  
  const handleMicClick = async () => {
     try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      toggleListening();
    } catch (error) {
      console.error("Microphone access denied:", error);
      toast({
        variant: "destructive",
        title: "Microphone Access Denied",
        description: "Please allow microphone access in your browser settings to use this feature.",
      });
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleMicClick}
      className={cn(isListening && "text-destructive")}
    >
      <Mic className="h-5 w-5" />
      <span className="sr-only">{isListening ? "Stop listening" : "Start listening"}</span>
    </Button>
  );
}

    
