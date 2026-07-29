const { test, expect } = require('@playwright/test');

async function waitForProducts(page) {
  await expect(page.locator('.search-searchProductsContainer')).toBeVisible();
  await expect(page.locator('.product-base').first()).toBeVisible();
  await expect(page.locator('.title-count')).toContainText(/\d/);
}

test('Navigate, apply sorting, filters, extract data, remove a filter, and re-extract', async ({ page }) => {
  await page.goto('https://www.myntra.com/');

  const menCategory = page.locator('a[data-group="men"]');
  await menCategory.hover();

  const tshirtsOption = page.locator('a[href="/men-tshirts"]');
  await expect(tshirtsOption).toBeVisible();
  await tshirtsOption.click();

  await expect(page).toHaveURL(/men-tshirts/i);
  await waitForProducts(page);

 // 1. Sort Order
  const sortContainer = page.locator('.sort-sortBy');
  await expect(sortContainer).toBeVisible();
  await sortContainer.hover();

  const lowToHighOption = page.locator('.sort-list label').filter({ hasText: /^Price: Low to High$/ });
  await expect(lowToHighOption).toBeVisible();
  await lowToHighOption.click();
  await expect(page).toHaveURL(/.*sort=price_asc/);

  const discountLabel = page.locator('.vertical-filters-label')
    .filter({ hasText: /10% and above/i })
    .first();
  await discountLabel.scrollIntoViewIfNeeded();
  await expect(discountLabel).toBeVisible();
  await discountLabel.click();
  await waitForProducts(page);

  const loungeTshirtsLabel = page.locator('.vertical-filters-label')
    .filter({ hasText: /lounge tshirts/i })
    .first();
  await loungeTshirtsLabel.scrollIntoViewIfNeeded();
  await expect(loungeTshirtsLabel).toBeVisible();
  await loungeTshirtsLabel.click();
  await waitForProducts(page);

  const filterChips = page.locator('.filter-summary-filter');
  await expect(filterChips).toHaveCount(2); 
  
  const initialChipTexts = (await filterChips.allInnerTexts()).map(text => text.trim()).filter(Boolean);
  console.log('--- Initial Applied Filters (Both Active) ---');
  initialChipTexts.forEach((chip, index) => console.log(`Filter ${index + 1}: ${chip}`));

  const initialProductCountText = page.locator('.title-count');
  await expect(initialProductCountText).toBeVisible();
  console.log(`Product Count with Both Filters: ${await initialProductCountText.innerText()}`);

  const productCards = page.locator('.product-base');
  const productCount = await productCards.count();
  console.log(`\n--- Extracting and Verifying ${productCount} Visible Products ---`);

  for (let i = 0; i < productCount; i++) {
    const card = productCards.nth(i);
    
    const priceText = await card.locator('.product-discountedPrice').textContent();
    const priceValue = parseInt(priceText.replace(/[^0-9]/g, ''), 10);
    
    const discountElement = card.locator('.product-discountPercentage');
    const hasDiscount = await discountElement.count() > 0;
    const discountText = hasDiscount ? await discountElement.textContent() : '';
    const discountMatch = discountText ? discountText.match(/\d+/) : null;
    const discountValue = discountMatch ? parseInt(discountMatch[0], 10) : 0;

    console.log(`Product ${i + 1} -> Price: Rs. ${priceValue}, Discount: ${discountValue}%`);
    
    expect(priceValue).toBeGreaterThan(0);
    if (discountValue > 0) {
      expect(discountValue).toBeGreaterThanOrEqual(10);
    }
  }

  console.log('\n--- Removing "lounge tshirts" filter ---');
  
  const discountCheckboxToRemove = page.locator('.vertical-filters-label')
    .filter({ hasText: /lounge tshirts/i })
    .first();
    
  await discountCheckboxToRemove.scrollIntoViewIfNeeded();
  await expect(discountCheckboxToRemove).toBeVisible();
  await discountCheckboxToRemove.click();
  await waitForProducts(page);

  const activeChips = [];
  const chipSpans = page.locator('.filter-summary-filter span');
  const spanCount = await chipSpans.count();
  
  for (let i = 0; i < spanCount; i++) {
    const text = await chipSpans.nth(i).innerText();
    const cleanText = text.trim();
    if (cleanText && !/^\d+$/.test(cleanText) && !/clear\s*all/i.test(cleanText)) {
      activeChips.push(cleanText);
    }
  }

  expect(activeChips.length).toBe(1);

  console.log('--- Updated Applied Filters (After Removal) ---');
  activeChips.forEach((chip, index) => console.log(`Updated Filter ${index + 1}: ${chip}`));

  const updatedProductCountText = page.locator('.title-count');
  await expect(updatedProductCountText).toBeVisible();
  
  const updatedCountText = await updatedProductCountText.innerText();
  console.log(`\nUpdated Product Count Display (After Removal): ${updatedCountText}`);
  
  expect(updatedCountText).toMatch(/\d+/);
});