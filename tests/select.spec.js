import { test, expect } from '@playwright/test';

test.describe('Example Test Suite', () => {
  test('select multiple', async ({ page }) => {
    await page.goto('C:\\Users\\SPURGE\\Downloads\\playwright-practice-site.html');
    
    const Selector = page.locator('#toppings'); 
    
    await Selector.selectOption(['mushroom', 'cheese', 'onion']);

    await expect(Selector).toHaveValues(['cheese', 'mushroom', 'onion']); 
  });
});