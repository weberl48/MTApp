'use client'

import type { ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, DollarSign } from 'lucide-react'

interface TeamPageTabsProps {
  overviewContent: ReactNode
  /**
   * Pay Rate Matrix. Omitted for roles without `team:view-rates` (admins) —
   * absent rather than disabled, so a missing prop fails closed.
   */
  ratesContent?: ReactNode
}

export function TeamPageTabs({ overviewContent, ratesContent }: TeamPageTabsProps) {
  // Nothing to switch between once Rates is hidden — drop the tab strip.
  if (!ratesContent) {
    return <>{overviewContent}</>
  }

  return (
    <Tabs defaultValue="overview">
      <TabsList className="mb-4">
        <TabsTrigger value="overview" data-tour="team-tab-overview" className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="rates" data-tour="team-tab-rates" className="flex items-center gap-1">
          <DollarSign className="w-4 h-4" />
          Rates
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview">{overviewContent}</TabsContent>
      <TabsContent value="rates">{ratesContent}</TabsContent>
    </Tabs>
  )
}
