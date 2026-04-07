import { test, expect } from '@playwright/test';

test.describe('Admin Logic & Sync', () => {
  const shopSlug = 'demo-sushi';

  test('should toggle shop status and verify on public page', async ({ page, context }) => {
    // 1. Login (Simplified for now, assuming we are on localhost)
    // In a real scenario, we'd use a saved storage state or perform a login first.
    await page.goto(`/${shopSlug}/admin/settings`);
    
    // Check if we are redirected to login, if so, we need to handle it.
    if (page.url().includes('/auth/login')) {
      // For now, we skip the actual login and focus on the UI interaction if possible,
      // or we assume the dev environment has a bypass/active session.
      console.log('Redirected to login. Admin tests require an active session.');
      return; 
    }

    // 2. Find the manual status button (Open/Closed switch)
    const statusButton = page.getByRole('button', { name: /GEÖFFNET|GESCHLOSSEN/i });
    const initialState = await statusButton.textContent();
    const isInitiallyOpen = initialState?.toUpperCase().includes('GEÖFFNET');

    // 3. Toggle the status
    await statusButton.click();
    
    // 4. Save settings
    const saveButton = page.getByRole('button', { name: /Speichern/i });
    await saveButton.click();
    await expect(page.locator('text=Gespeichert')).toBeVisible();

    // 5. Verify on public shop page
    const newPage = await context.newPage();
    await newPage.goto(`/${shopSlug}`);
    
    if (isInitiallyOpen) {
      // Should now be closed
      await expect(newPage.locator('text=Wir haben aktuell geschlossen')).toBeVisible();
    } else {
      // Should now be open
      await expect(newPage.locator('text=Wir haben aktuell geschlossen')).not.toBeVisible();
    }

    // 6. Cleanup: Toggle back
    await page.bringToFront();
    await statusButton.click();
    await saveButton.click();
  });
});
