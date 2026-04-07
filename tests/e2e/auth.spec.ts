import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should show validation error for short password', async ({ page }) => {
    await page.goto('/auth/signup');
    
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', '123');
    
    // Playwright will wait for the native validation or we can just try to click
    const signupButton = page.getByRole('button', { name: 'Konto erstellen' });
    await signupButton.click();
    
    // Native HTML5 validation check
    const passwordInput = page.locator('input[type="password"]');
    const validationMessage = await passwordInput.evaluate((idx: HTMLInputElement) => idx.validationMessage);
    expect(validationMessage).not.toBe('');
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/auth/signup');
    await page.getByRole('link', { name: 'Anmelden' }).click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
