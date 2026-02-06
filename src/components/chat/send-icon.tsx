
import { cn } from '@/lib/utils';
import Image from 'next/image';

export const SendIcon = ({
  className,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) => {
  return (
    <Image
      src="/my-icon.png"
      alt="Send"
      width={24}
      height={24}
      className={cn('h-5 w-5', className)}
      unoptimized
      {...props}
    />
  );
};
