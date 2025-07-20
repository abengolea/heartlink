import { HeartPulse } from 'lucide-react';

export default function Logo() {
  return (
    <div className="flex items-center gap-2 text-primary">
      <HeartPulse className="h-6 w-6" />
      <span className="text-xl font-bold text-foreground">HeartLink</span>
    </div>
  );
}
