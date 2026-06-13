/**
 * Dev utility: drives the main user flows end-to-end against a running app
 * and saves screenshots. Throws if an expected state never appears.
 * Usage: node scripts/flows.mjs [baseUrl]
 */
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const base = process.argv[2] ?? 'http://localhost:4173'
mkdirSync('screenshots', { recursive: true })

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()

// 1. Start today's planned workout from the dashboard.
await page.goto(base + '/', { waitUntil: 'networkidle' })
await page.getByRole('button', { name: 'Start workout' }).click()
await page.waitForURL(/\/active$/)

// 2. Check off a few sets.
const checks = page.getByRole('button', { name: /Mark set \d+ done/ })
for (let i = 0; i < 4; i++) await checks.nth(i).click()
await page.screenshot({ path: 'screenshots/flow-active-session.png' })

// 3. Finish (confirm the unchecked-sets dialog).
await page.getByRole('button', { name: 'Finish' }).click()
await page.getByRole('button', { name: 'Finish workout' }).click()
await page.waitForSelector('text=Completed')
await page.screenshot({ path: 'screenshots/flow-workout-complete.png' })

// 4. Dashboard reflects the completed session.
await page.goto(base + '/', { waitUntil: 'networkidle' })
await page.waitForSelector('text=Done for today')
await page.screenshot({ path: 'screenshots/flow-dashboard-after.png' })

// 5. Log a body weight entry.
await page.goto(base + '/progress', { waitUntil: 'networkidle' })
await page.getByRole('button', { name: 'Log weight' }).click()
await page.getByLabel('Weight (kg)').fill('81.4')
await page.getByRole('button', { name: 'Save entry' }).click()
await page.waitForSelector('text=Weight logged')

// 6. Light theme.
await page.goto(base + '/settings', { waitUntil: 'networkidle' })
await page.getByRole('tab', { name: /Light/ }).click()
await page.goto(base + '/', { waitUntil: 'networkidle' })
await page.waitForTimeout(300)
await page.screenshot({ path: 'screenshots/flow-dashboard-light.png' })

// 7. 404 page.
await page.goto(base + '/definitely-not-a-route', { waitUntil: 'networkidle' })
await page.waitForSelector('text=Page not found')

await browser.close()
console.log('all flows passed')
