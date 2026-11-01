'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function OrderFilters() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <Button onClick={() => setIsOpen(!isOpen)}>{isOpen ? 'Hide filters' : 'Show filters'}</Button>
    </div>
  );
}
