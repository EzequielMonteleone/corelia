import Image from 'next/image';
import {cn} from '@/lib/utils';

type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({className}: BrandLogoProps) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-[0.28em] text-[2.5rem] text-white',
        className,
      )}>
      <Image
        src="/brand/corelia-mark.png"
        alt=""
        width={686}
        height={686}
        sizes="48px"
        preload
        className="size-[1em] shrink-0"
      />
      <span className="text-[0.72em] font-bold leading-none tracking-tight">
        Corelia
      </span>
    </span>
  );
}
