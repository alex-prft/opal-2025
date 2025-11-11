'use client';

import { Button } from '@/components/ui/button';
import { BarChart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import ForceSyncButton from '@/components/ForceSyncButton';

export default function AdminHeader() {
  return (
    <header className="border-b bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/engine/admin">
              <div className="rounded-lg p-3 cursor-pointer hover:shadow-lg transition-shadow">
                <Image
                  src="/images/gradient-orb.png"
                  alt="Optimizely Strategy Assistant"
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              </div>
            </Link>
            <Link href="/engine/admin">
              <div className="cursor-pointer hover:text-blue-600 transition-colors">
                <h1 className="text-xl font-bold">Admin Configuration</h1>
                <p className="text-muted-foreground text-sm">Opal Strategy Assistant</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <ForceSyncButton />

            <Link href="/engine/results">
              <Button variant="outline" size="sm" className="gap-2">
                <BarChart className="h-4 w-4" />
                View Results
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}