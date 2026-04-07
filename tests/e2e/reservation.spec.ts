import { test, expect } from '@playwright/test';

test.describe('Reservation Logic', () => {
  const shopSlug = 'demo-sushi';

  test('should fill out the reservation form and show success', async ({ page }) => {
    await page.goto(`/${shopSlug}/reserve`);
    
    // 1. Wait for the page to load
    await expect(page.locator('text=Tisch reservieren')).toBeVisible({ timeout: 10000 });

    // 2. Select guest count FIRST (e.g., 2 persons is safer for most shop setups)
    const guestButton = page.getByRole('button', { name: '2', exact: true });
    await guestButton.click();
    await expect(guestButton).toHaveClass(/border-primary/);

    // 3. Try to find a slot within the next 7 days
    let slotFound = false;
    let timeSlot;
    
    for (let i = 1; i <= 7; i++) {
      const nextDay = new Date();
      nextDay.setDate(nextDay.getDate() + i);
      const dateStr = nextDay.toISOString().split('T')[0];
      
      const dateInput = page.locator('input[type="date"]');
      await dateInput.fill(dateStr);
      
      // Check if slots appeared
      timeSlot = page.locator('button:has-text(":")').first();
      try {
        await expect(timeSlot).toBeVisible({ timeout: 4000 });
        slotFound = true;
        console.log(`Found slot on ${dateStr}`);
        break; // Found one!
      } catch {
        console.log(`No slots on ${dateStr}, trying next day...`);
      }
    }

    if (!slotFound || !timeSlot) {
      throw new Error("No slots found in the next 7 days for demo-sushi. Please check shop opening hours and table configuration.");
    }
    
    const timeText = await timeSlot.textContent();
    await timeSlot.click();
    
    // Verify selection (the button becomes primary)
    await expect(timeSlot).toHaveClass(/bg-primary/);

    // 5. Fill out contact details
    await page.getByPlaceholder('Max Mustermann').fill('Test User');
    await page.getByPlaceholder('0171 1234567').fill('0123456789');

    // 6. Submit reservation
    const submitButton = page.getByRole('button', { name: 'Tisch kostenfrei reservieren' });
    await submitButton.click();

    // 7. Verify success screen
    await expect(page.locator('text=Tisch reserviert!')).toBeVisible({ timeout: 15000 });
  });
});
