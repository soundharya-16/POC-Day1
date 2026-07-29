const { test, expect } = require('@playwright/test');

test('Search pagination for a specific Item on Rahul Shetty Practice Site', async ({ page }) => {
  await page.goto('https://rahulshettyacademy.com/seleniumPractise/#/offers');

  // Let's search for 'Cheese' to force the script to click through multiple pages
  const targetItem = 'Cheese';
  const maxPages = 10;
  
  let itemFound = false;
  let currentPage = 1;

  console.log(`Starting search for item: ${targetItem}`);

  while (currentPage <= maxPages) {
    console.log(`\n--- Scanning page ${currentPage} ---`);

    // 1. Wait for the rows to be visible on the screen
    await page.waitForSelector('tbody tr td:nth-child(1)', { state: 'visible' });
    
    // 2. Add a small hard wait. 
    // While usually discouraged, this allows the Angular DOM to settle on this specific site.
    await page.waitForTimeout(500); 

    // 3. Grab all item names on the current page
    const itemElements = page.locator('tbody tr td:nth-child(1)');
    const itemTexts = await itemElements.allTextContents();

    console.log(`Items found on this page:`, itemTexts);

    // 4. Check if our target is in the list
    if (itemTexts.includes(targetItem)) {
      console.log(`\n✅ Success! Found '${targetItem}' on page ${currentPage}.`);
      itemFound = true;
      break; // Exit the loop
    }

    // 5. Navigate to the next page if not found
    const nextButton = page.locator('[aria-label="Next"]');
    
    // Evaluate the button in the browser to safely check if it is disabled
    const isNextDisabled = await nextButton.evaluate(btn => {
      return btn.hasAttribute('disabled') || 
             btn.getAttribute('aria-disabled') === 'true' ||
             btn.parentElement.classList.contains('disabled');
    });

    if (!isNextDisabled) {
      await nextButton.click();
    } else {
      console.log('\nNext button is disabled. Reached the end of the list.');
      break;
    }

    currentPage++;
  }

  // 6. Playwright Assertion
  expect(itemFound, `Item '${targetItem}' was not found.`).toBeTruthy();
});