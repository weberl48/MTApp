'use client'

import type { ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, DollarSign } from 'lucide-react'

interface TeamPageTabsProps {
  overviewContent: ReactNode
  ratesContent: ReactNode
}

export function TeamPageTabs({ overviewContent, ratesContent }: TeamPageTabsProps) {
  return (
    <Tabs defaultValue="overview">
      <TabsList className="mb-4">
        <TabsTrigger value="overview" className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="rates" className="flex items-center gap-1">
          <DollarSign className="w-4 h-4" />
          Rates
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview">{overviewContent}</TabsContent>
      <TabsContent value="rates">{ratesContent}</TabsContent>
    </Tabs>
  )
}
