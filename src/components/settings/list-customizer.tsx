'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

interface ListItem {
  label: string
  visible: boolean
}

interface ListCustomizerProps {
  title: string
  description: string
  items: Record<string, ListItem>
  defaultLabels: Record<string, string>
  onChange: (items: Record<string, ListItem>) => void
}

export function ListCustomizer({ title, description, items, defaultLabels, onChange }: ListCustomizerProps) {
  function updateItem(key: string, updates: Partial<ListItem>) {
    onChange({
      ...items,
      [key]: {
        ...items[key],
        label: items[key]?.label || defaultLabels[key] || key,
        visible: items[key]?.visible ?? true,
        ...updates,
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.entries(defaultLabels).map(([key, defaultLabel]) => {
            const item = items[key] || { label: defaultLabel, visible: true }
            return (
              <div
                key={key}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  item.visible ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800 opacity-60'
                }`}
              >
                <Switch
                  checked={item.visible}
                  onCheckedChange={(checked) => updateItem(key, { visible: checked })}
                  aria-label={`Toggle ${defaultLabel}`}
                />
                <div className="flex-1 min-w-0">
                  <Input
                    value={item.label}
                    onChange={(e) => updateItem(key, { label: e.target.value })}
                    className="h-8 text-sm"
                    placeholder={defaultLabel}
                  />
                </div>
                <span className="text-xs text-gray-400 shrink-0">{key}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
