import { test, expect, type TestInfo } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

/**
 * FULL LIFECYCLE E2E TEST
 * 
 * This test simulates a brand new restaurant owner:
 * 1. Signup
 * 2. Onboarding (Shop Creation)
 * 3. Admin Setup (Opening Hours, Tables, Menu)
 * 4. Public Flow (Reservation, Ordering)
 * 
 * Cleanup: The shop and its data should ideally be deleted after the test.
 */

test.describe('Full Shop Lifecycle', () => {
  const timestamp = Date.now();
  const testEmail = `test-owner-${timestamp}@test.bestellen.de`;
  const testPassword = 'Password123!';
  const shopName = `Test Restaurant ${timestamp}`;
  const shopSlug = `test-res-${timestamp}`;
  
  // Initialize Supabase client for cleanup (using static keys for test runner consistency)
  const supabase = createClient(
    'https://udjcoctehnyvgbkuehut.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkamNvY3RlaG55dmdia3VlaHV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NTQzNTQsImV4cCI6MjA5MDUzMDM1NH0.sf_uf11H2B-__CONT1NeaQ8sgL-7vHHMigd2T8BnWLQ'
  );

  test.afterEach(async ({}, testInfo: TestInfo) => {
    if (testInfo.status === 'passed') {
      console.log(`\n--- CLEANUP: Test passed. Deleting test data for ${shopSlug}... ---`);
      const { error } = await supabase.rpc('cleanup_test_data', { p_shop_slug: shopSlug });
      if (error) {
        console.error('Cleanup RPC failed:', error.message);
      } else {
        console.log('Cleanup successful.');
      }
    } else {
      console.log(`\n--- CLEANUP SKIPPED: Test status is ${testInfo.status}. Keeping ${shopSlug} for debugging. ---`);
    }
  });

  test('should complete the entire shop lifecycle', async ({ page, browser }) => {
    console.log(`Starting test with email: ${testEmail}`);

    // --- STEP 1: SIGNUP ---
    console.log('Step 1: Signup');
    await page.goto('/auth/signup');
    await page.getByPlaceholder('name@restaurant.de').fill(testEmail);
    await page.getByPlaceholder('Mindestens 6 Zeichen').fill(testPassword);
    await page.getByRole('button', { name: 'Konto erstellen' }).click();

    // Check if we are redirected to onboarding or see the "Fast geschafft!" (Success) page
    console.log('Waiting for signup success or redirect...');
    const onboardingUrl = new RegExp(`.*onboarding`);
    try {
      await expect(page).toHaveURL(onboardingUrl, { timeout: 8000 });
      console.log('Redirected to onboarding automatically.');
    } catch (e) {
      console.log('Not redirected automatically, checking for success message...');
      await expect(page.locator('text=Fast geschafft!')).toBeVisible({ timeout: 5000 });
      console.log('Signup successful, manual navigation to /onboarding');
      await page.goto('/onboarding');
    }

    // --- STEP 2: ONBOARDING ---
    console.log('Step 2: Onboarding');
    await page.getByPlaceholder('z.B. Sushi Gallery').fill(shopName);
    const slugInput = page.locator('input[placeholder="sushi-gallery"]');
    await slugInput.clear();
    await slugInput.fill(shopSlug);
    
    console.log('Waiting for slug availability check...');
    await page.waitForTimeout(2000); 
    await page.getByRole('button', { name: 'Shop erstellen' }).click();

    console.log('Waiting for admin dashboard redirect...');
    await expect(page).toHaveURL(new RegExp(`.*${shopSlug}/admin`), { timeout: 20000 });

    // --- STEP 3: ADMIN SETUP - OPENING HOURS ---
    console.log('Step 3: Opening Hours');
    await page.goto(`/${shopSlug}/admin/settings`);
    
    // JS getDay() is 0=Sunday, 1=Monday...
    // Our app index is 0=Monday, 1=Tuesday... 6=Sunday
    const jsDay = new Date().getDay();
    const appDayIdx = jsDay === 0 ? 6 : jsDay - 1;
    
    console.log(`Setting hours for today (index ${appDayIdx}) and tomorrow.`);
    
    // Add for today
    await page.locator('select').selectOption({ index: appDayIdx }); 
    await page.locator('input[type="time"]').first().fill('00:00');
    await page.locator('input[type="time"]').last().fill('23:59');
    await page.locator('button:has(svg.lucide-plus)').first().click();

    // Add for tomorrow (just in case)
    const nextDayIdx = (appDayIdx + 1) % 7;
    await page.locator('select').selectOption({ index: nextDayIdx }); 
    await page.locator('input[type="time"]').first().fill('00:00');
    await page.locator('input[type="time"]').last().fill('23:59');
    await page.locator('button:has(svg.lucide-plus)').first().click();

    console.log('Added opening hours slots.');

    // --- STEP 4: ADMIN SETUP - TABLES ---
    console.log('Step 4: Table Setup');
    await page.getByPlaceholder('Tisch Name/Nr.').fill('Tisch 1');
    
    // Target the capacity input: it's the one with class "w-12"
    await page.locator('input.w-12[type="number"]').fill('4');
    
    await page.getByRole('button', { name: 'Hinzufügen', exact: true }).click(); 
    await expect(page.locator('text=Tisch 1')).toBeVisible({ timeout: 5000 });
    console.log('Added Table 1.');

    // Save Settings
    console.log('Saving admin settings...');
    await page.getByRole('button', { name: /Speichern/i }).click();
    await expect(page.locator('text=erfolgreich gespeichert').or(page.locator('text=Gespeichert'))).toBeVisible({ timeout: 10000 });
    console.log('Settings saved.');

    // --- STEP 5: ADMIN SETUP - MENU ---
    console.log('Step 5: Menu Setup');
    await page.goto(`/${shopSlug}/admin/menu`);
    
    console.log('Adding category...');
    await page.getByRole('button', { name: 'Kategorie', exact: true }).click();
    await page.getByPlaceholder('z.B. Vorspeisen').fill('Test Kategorie');
    await page.getByRole('button', { name: 'Kategorie speichern' }).click();
    await expect(page.locator('text=Test Kategorie')).toBeVisible({ timeout: 5000 });

    console.log('Adding product...');
    await page.getByRole('button', { name: 'Produkt' }).first().click();
    await page.getByPlaceholder('z.B. Sushi Mix Large').fill('Test Produkt');
    await page.getByPlaceholder('Zutaten, Allergene oder Details...').fill('Leckeres Testprodukt');
    
    // Fill price
    const priceInput = page.getByPlaceholder('12.50');
    await priceInput.fill('10.00');

    // Fill mandatory fields: Preparation Time and Capacity
    console.log('Filling mandatory product fields...');
    await page.getByPlaceholder('z.B. 10').fill('15');
    await page.getByPlaceholder('z.B. 3').fill('5');
    
    await page.getByRole('button', { name: 'Produkt speichern' }).click();
    await expect(page.locator('text=Test Produkt')).toBeVisible({ timeout: 10000 });
    console.log('Menu setup complete.');

    // --- STEP 6: PUBLIC FLOW - RESERVATION ---
    console.log('Step 6: Public Reservation (as Guest)');
    console.log('Creating guest context...');
    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();
    
    console.log(`Navigating to reservation page: /${shopSlug}/reserve`);
    await guestPage.goto(`/${shopSlug}/reserve`);
    
    // Ensure the date picker is ready
    const dateInput = guestPage.locator('input[type="date"]');
    await expect(dateInput).toBeVisible();
    await dateInput.fill(new Date().toISOString().split('T')[0]);
    
    // Select 2 persons (it's a button group now, not a select)
    await guestPage.getByRole('button', { name: '2', exact: true }).click();
    
    console.log('Waiting for available slots...');
    let slotButton = guestPage.locator('button:has-text(":")').first();
    
    try {
      await expect(slotButton).toBeVisible({ timeout: 10000 });
    } catch (e) {
      console.log('No slots for today, trying tomorrow...');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await guestPage.locator('input[type="date"]').fill(tomorrow.toISOString().split('T')[0]);
      await expect(slotButton).toBeVisible({ timeout: 10000 });
    }
    
    await slotButton.click();
    
    await guestPage.getByPlaceholder('Max Mustermann').fill('Test Gast');
    await guestPage.getByPlaceholder('0171 1234567').fill('0171 1234567');
    await guestPage.getByRole('button', { name: 'Tisch kostenfrei reservieren' }).click();
    
    await expect(guestPage.locator('text=Tisch reserviert!')).toBeVisible({ timeout: 15000 });
    console.log('Reservation confirmed.');

    // --- STEP 7: PUBLIC FLOW - ORDERING ---
    console.log('Step 7: Public Ordering (as Guest)');
    await guestPage.goto(`/${shopSlug}`);
    
    // Wait for the product to appear
    console.log('Waiting for product to be visible...');
    await expect(guestPage.locator('text=Test Produkt').first()).toBeVisible({ timeout: 20000 });
    
    // Select product to open modal
    console.log('Opening product detail modal for "Test Produkt"...');
    // Click the clickable container of the product card
    const productCard = guestPage.locator('.group:has-text("Test Produkt")').locator('.aspect-\\[4\\/5\\]');
    await productCard.first().click();
    
    // Add to cart from modal
    console.log('Waiting for modal and clicking "In den Warenkorb"...');
    const addToCartButton = guestPage.locator('button', { hasText: /In den Warenkorb/ });
    await expect(addToCartButton).toBeVisible({ timeout: 15000 });
    await addToCartButton.click();
    
    // Check if modal closed or cart updated
    console.log('Product added. Waiting for checkout link visibility...');
    const checkoutLink = guestPage.locator('a[href$="/checkout"]').first();
    await expect(checkoutLink).toBeVisible({ timeout: 15000 });
    
    console.log('Navigating to checkout...');
    await checkoutLink.click();
    
    console.log('Verifying checkout page...');
    await expect(guestPage.getByRole('heading', { name: 'Bestellung prüfen' })).toBeVisible({ timeout: 15000 });
    
    console.log('Filling checkout details...');
    await guestPage.getByPlaceholder('z.B. Max Mustermann').fill('Test Kunde');
    await guestPage.getByPlaceholder('Für Rückfragen bei der Bestellung').fill('0171 7654321');
    
    console.log('Submit order...');
    await guestPage.getByRole('button', { name: 'Jetzt bestellen' }).click();
    await expect(guestPage).toHaveURL(/.*confirmation/, { timeout: 20000 });
    console.log('Order complete.');
    
    await guestContext.close();

    // --- STEP 8: ADMIN VERIFICATION ---
    console.log('Step 8: Admin Verification');
    await page.goto(`/${shopSlug}/admin`);
    await expect(page.locator('text=Test Kunde')).toBeVisible({ timeout: 15000 });
    console.log('Test completed successfully!');
  });
});
