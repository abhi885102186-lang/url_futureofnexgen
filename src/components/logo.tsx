'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

export const Logo = ({
  className,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) => {
  return (
    <Image
      src="/logo.png"
      alt="Logo"
      width={24}
      height={24}
      className={cn('h-6 w-6', className)}
      unoptimized
      {...props}
    />
  );
};
