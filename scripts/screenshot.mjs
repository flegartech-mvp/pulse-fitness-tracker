/**
 * Dev utility: screenshots every page at desktop + mobile sizes using the
 * system Chrome. Usage: node scripts/screenshot.mjs [baseUrl]
 * Expects the app to be running (npm run preview or dev).
 */
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const base = process.argv[2] ?? 'http://localhost:4173'
const routes = [
  ['dashboard', '/'],
  ['workouts', '/workouts'],
  ['builder', '/workouts/new'],
  ['exercises', '/exercises'],
  ['progress', '/progress'],
  ['goals', '/goals'],
  ['settings', '/settings'],
]
const viewports = [
  ['desktop', { width: 1440, height: 900 }],
  ['mobile', { width: 390, height: 844 }],
]

mkdirSync('screenshots', { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })

for (const [vpName, viewport] of viewports) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 })
  const page = await context.newPage()
  for (const [name, route] of routes) {
    await page.goto(base + route, { waitUntil: 'networkidle' })
    await page.waitForTimeout(350)
    await page.screenshot({ path: `screenshots/${name}-${vpName}.png`, fullPage: name !== 'dashboard' })
  }
  await context.close()
}

await browser.close()
console.log('done')
