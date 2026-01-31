#!/usr/bin/env npx tsx

/**
 * Post-deploy health check script
 *
 * Usage:
 *   npx tsx scripts/health-check.ts [base-url]
 *
 * Examples:
 *   npx tsx scripts/health-check.ts                          # checks localhost:3000
 *   npx tsx scripts/health-check.ts https://your-app.vercel.app
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000'

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  checks: Record<string, { status: string; message: string; latency?: number }>
}

async function checkEndpoint(path: string, name: string): Promise<boolean> {
  const url = `${BASE_URL}${path}`
  const start = Date.now()

  try {
    const response = await fetch(url, {
      headers: { 'Cache-Control': 'no-cache' },
    })
    const latency = Date.now() - start
    const data = await response.json()

    if (response.ok) {
      console.log(`✅ ${name} (${latency}ms)`)
      return true
    } else {
      console.log(`❌ ${name} (${response.status}): ${JSON.stringify(data)}`)
      return false
    }
  } catch (err) {
    console.log(`❌ ${name}: ${err instanceof Error ? err.message : 'Failed to connect'}`)
    return false
  }
}

async function main() {
  console.log(`\n🏥 Health Check for ${BASE_URL}\n`)
  console.log('─'.repeat(50))

  // Check liveness first
  const liveOk = await checkEndpoint('/api/health/live', 'Liveness')

  if (!liveOk) {
    console.log('\n💀 Application is not running!\n')
    process.exit(1)
  }

  // Check readiness
  const readyOk = await checkEndpoint('/api/health/ready', 'Readiness')

  // Get full health report
  console.log('\n📋 Full Health Report:\n')

  try {
    const response = await fetch(`${BASE_URL}/api/health`, {
      headers: { 'Cache-Control': 'no-cache' },
    })
    const health: HealthResponse = await response.json()

    const statusEmoji = health.status === 'healthy' ? '💚' : health.status === 'degraded' ? '💛' : '❤️'
    console.log(`Status: ${statusEmoji} ${health.status.toUpperCase()}`)
    console.log(`Version: ${health.version}`)
    console.log(`Time: ${health.timestamp}\n`)

    console.log('Checks:')
    for (const [name, check] of Object.entries(health.checks)) {
      const emoji = check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️' : '❌'
      const latencyStr = check.latency ? ` (${check.latency}ms)` : ''
      console.log(`  ${emoji} ${name}: ${check.message}${latencyStr}`)
    }

    console.log('\n' + '─'.repeat(50))

    if (health.status === 'healthy') {
      console.log('✨ All systems operational!\n')
      process.exit(0)
    } else if (health.status === 'degraded') {
      console.log('⚠️  System is degraded - check warnings above\n')
      process.exit(0) // Still exit 0 for degraded - warnings are acceptable
    } else {
      console.log('🚨 System is unhealthy!\n')
      process.exit(1)
    }
  } catch (err) {
    console.log(`❌ Failed to fetch health report: ${err instanceof Error ? err.message : 'Unknown error'}`)
    process.exit(1)
  }
}

main()
