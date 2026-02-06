
import { cn } from '@/lib/utils';
import Image from 'next/image';

export const VoiceIcon = ({
  className,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) => {
  return (
    <Image
      src="/voice-icon.png"
      alt="Voice conversation icon"
      width={20}
      height={20}
      className={cn('h-5 w-5', className)}
      unoptimized
      {...props}
    />
  );
};
