import { test, expect } from '@playwright/test';

test.describe('Order Flow', () => {
  const shopSlug = 'demo-sushi'; // We assume this exists or use a dynamic one

  test('should add an item to the cart and navigate to checkout', async ({ page }) => {
    // 1. Go to the shop page
    await page.goto(`/${shopSlug}`);
    
    // 2. Wait for products to load
    const firstProductCard = page.locator('.group.relative').first();
    await expect(firstProductCard).toBeVisible();

    // 3. Find the "Plus" button to add to cart
    const addButton = firstProductCard.locator('button').filter({ has: page.locator('svg.lucide-plus') });
    await addButton.click();

    // 4. Verify shop cart count in MobileNav (using ShoppingBag icon link)
    // We target the specific span with the count inside the checkout link
    const cartLink = page.locator('a[href*="/checkout"]');
    const cartCount = cartLink.locator('span.bg-primary').first();
    await expect(cartCount).toHaveText('1');

    // 5. Navigate to checkout (using first() to avoid ambiguity between desktop/mobile nav)
    await cartLink.first().click({ force: true });
    await expect(page).toHaveURL(new RegExp(`/${shopSlug}/checkout`));

    // 6. Verify item is in checkout - check for the unique title
    await expect(page.locator('h1:has-text("Bestellung prüfen")')).toBeVisible();
  });
});
