const { test, expect } = require('@playwright/test');

test('Navigate, filter, sort, and verify products without hard waits', async ({ page }) => {
  // 1. Navigate to Myntra homepage
  await page.goto('https://www.myntra.com/'); 
  
  // 2. Hover over "MEN" category and click "T-Shirts"
  const menCategory = page.locator('a[data-group="men"]');
  await menCategory.hover();

  const tshirtsOption = page.locator('a[href="/men-tshirts"]');
  await tshirtsOption.click();

  // 3. Verify navigation and wait for products container to load
  await expect(page).toHaveURL(/.*men-tshirts/);
  await page.waitForSelector('.search-searchProductsContainer', { state: 'visible' });  

  // 4. Sort by Price: Low to High (and wait for network/data to re-fetch)
  const sortDropdown = page.locator('.sort-sortBy');
  await sortDropdown.hover();
  
  await Promise.all([
    page.waitForResponse(response => response.url().includes('search') && response.status() === 200),
    page.getByText('Price: Low to High').first().click()
  ]);

  // 5. Select "50% and above" discount filter option safely
  const discountLabel = page.locator('label').filter({ hasText: '50% and above' }).first();
  await discountLabel.waitFor({ state: 'visible' });
  
  await Promise.all([
    page.waitForResponse(response => response.url().includes('search') && response.status() === 200),
    discountLabel.click({ force: true })
  ]);

  // 6. Select Size 'L' under Categories/Sizes
  const sizeHeading = page.getByText('Size', { exact: true }).first();
  await sizeHeading.waitFor({ state: 'visible' });
  await sizeHeading.click();

  const sizeL = page.getByText('L', { exact: true }).locator(':visible').first();
  await sizeL.waitFor({ state: 'visible' });
  
  await Promise.all([
    page.waitForResponse(response => response.url().includes('search') && response.status() === 200),
    sizeL.click({ force: true })
  ]);

  // 7. Extract and log the text of every "applied filter" chip shown on screen
  const filterChips = page.locator('.filter-summary-filter');
  await filterChips.first().waitFor({ state: 'visible' });
  const chipTexts = await filterChips.allInnerTexts();
  
  console.log('Currently Applied Filters:', chipTexts);
  expect(chipTexts.some(text => text.trim() === 'L')).toBeTruthy();
  expect(chipTexts.some(text => text.includes('50'))).toBeTruthy();  

  // 8. Capture initial product count
  const initialCountText = await page.locator('.title-count').textContent();
  const initialProductCount = parseInt(initialCountText.replace(/\D/g, ''), 10);
  console.log(`Initial Product Count: ${initialProductCount}`);

  // 9. Extract visible product prices, brand names, and discounts to verify expectations
  const productCards = page.locator('.product-base');
  await productCards.first().waitFor({ state: 'visible' });
  
  const countToTest = Math.min(5, await productCards.count());  
  let previousPrice = 0;

  for (let i = 0; i < countToTest; i++) {
    const card = productCards.nth(i);
    const titleText = await card.locator('.product-brand').textContent();
    const priceText = await card.locator('.product-discountedPrice').textContent();
    const discountText = await card.locator('.product-discountPercentage').textContent();

    expect.soft(titleText, `Product ${i+1} is missing a brand title`).toBeTruthy();

    if (priceText) {
      const currentPrice = parseInt(priceText.replace(/\D/g, ''), 10);
      expect.soft(
        currentPrice, 
        `Product ${i+1} price (${currentPrice}) is lower than previous (${previousPrice})`
      ).toBeGreaterThanOrEqual(previousPrice);
      previousPrice = currentPrice;
    }

    if (discountText) {
      const discountMatch = discountText.match(/\d+/);
      if (discountMatch) {
        const discountValue = parseInt(discountMatch[0], 10);
        expect.soft(
          discountValue, 
          `Product ${i+1} discount (${discountValue}%) is below 50%`
        ).toBeGreaterThanOrEqual(50);
      }
    }
  }

  // 10. Remove Size L filter via its close/remove chip
  console.log('Removing Size L filter...');
  const chipToRemove = page.locator('.filter-summary-filter')
                           .filter({ hasText: 'L' })
                           .filter({ hasNotText: 'Lounge' }) 
                           .locator('.filter-summary-removeFilter');
                           
  await chipToRemove.waitFor({ state: 'visible' });

  await Promise.all([
    page.waitForResponse(response => response.url().includes('search') && response.status() === 200),
    chipToRemove.click({ force: true })
  ]);

  // 11. Verify filter removal and check updated metrics
  const updatedFilterChips = page.locator('.filter-summary-filter');
  // Wait until the chip element count drops or changes state
  await page.waitForFunction(() => document.querySelectorAll('.filter-summary-filter').length < 2);
  
  const updatedChipTexts = await updatedFilterChips.allInnerTexts();
  const isLStillThere = updatedChipTexts.some(text => text.trim() === 'L');
  expect(isLStillThere).toBeFalsy();  

  const newCountText = await page.locator('.title-count').textContent();
  const newProductCount = parseInt(newCountText.replace(/\D/g, ''), 10);
  console.log(`New Product Count: ${newProductCount} (Initial was: ${initialProductCount})`);
  
  expect(newProductCount).toBeGreaterThanOrEqual(initialProductCount);

  // 12. Re-verify sort order on the first two items after filter removal
  const firstCardPriceAfter = await productCards.nth(0).locator('.product-discountedPrice').textContent();
  const secondCardPriceAfter = await productCards.nth(1).locator('.product-discountedPrice').textContent();

  if (firstCardPriceAfter && secondCardPriceAfter) {
    const price1 = parseInt(firstCardPriceAfter.replace(/\D/g, ''), 10);
    const price2 = parseInt(secondCardPriceAfter.replace(/\D/g, ''), 10);
    console.log(`Verifying Sort Order After Filter Removal...`);
    console.log(`Product 1 Price: ${price1} | Product 2 Price: ${price2}`);
    expect(price2).toBeGreaterThanOrEqual(price1);
  }
});