const { test, expect } = require('@playwright/test');

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop', width: 1280, height: 720 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
];

function collectSeriousConsole(page) {
  const messages = [];
  page.on('console', message => {
    if (message.type() === 'error') {
      messages.push(message.text());
    }
  });
  page.on('pageerror', error => messages.push(error.message));
  return messages;
}

async function expectNoSeriousConsole(messages) {
  expect(messages.filter(Boolean)).toEqual([]);
}

test.describe('FitQuest web smoke', () => {
  for (const viewport of viewports) {
    test(`login page renders without console errors on ${viewport.name}`, async ({ page }) => {
      const consoleErrors = collectSeriousConsole(page);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');

      await expect(page.getByText('FitQuest', { exact: true })).toBeVisible();
      await expect(page.getByLabel('Email address')).toBeVisible();
      await expect(page.getByLabel('Password')).toBeVisible();
      await page.screenshot({
        path: `output/playwright/${viewport.name}-login.png`,
        fullPage: true,
      });

      await expectNoSeriousConsole(consoleErrors);
    });
  }

  test('auth navigation and validation states work', async ({ page }) => {
    const consoleErrors = collectSeriousConsole(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    await page.getByRole('button', { name: 'Log in to FitQuest' }).click();
    await expect(page.getByText('Email is required.').last()).toBeVisible();
    await expect(page.getByText('Password is required.').last()).toBeVisible();

    await page.getByText('Sign Up').click();
    await expect(page.getByText('Start your next level')).toBeVisible();
    await page.screenshot({ path: 'output/playwright/register.png', fullPage: true });

    await page.getByRole('button', { name: 'Create FitQuest account' }).click();
    await expect(page.getByText('Display name is required.')).toBeVisible();
    await expect(page.getByText('Email is required.').last()).toBeVisible();
    await expect(page.getByText('Password is required.').last()).toBeVisible();
    await expect(page.getByText('Confirm your password.')).toBeVisible();

    await page.getByLabel('Display name').fill('Smoke Tester');
    await page.getByLabel('Email address').last().fill('not-an-email');
    await page.getByLabel('Password', { exact: true }).last().fill('123');
    await page.getByLabel('Confirm password').fill('456');
    await page.getByRole('button', { name: 'Create FitQuest account' }).click();

    await expect(page.getByText('Enter a valid email address.')).toBeVisible();
    await expect(page.getByText('Password must be at least 6 characters.')).toBeVisible();
    await expect(page.getByText('Passwords do not match.')).toBeVisible();

    await page.getByText('Log In').last().click();
    await expect(page.getByText('Welcome back')).toBeVisible();
    await page.reload();
    await expect(page.getByText('Welcome back')).toBeVisible();

    await expectNoSeriousConsole(consoleErrors);
  });

  test('invalid route does not crash the app shell', async ({ page }) => {
    const consoleErrors = collectSeriousConsole(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/definitely-not-a-real-route');

    await expect(page.getByText('FitQuest', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Log in to FitQuest' })).toBeVisible();
    await page.screenshot({ path: 'output/playwright/invalid-route.png', fullPage: true });

    await expectNoSeriousConsole(consoleErrors);
  });
});
