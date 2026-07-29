const { test, expect } = require('@playwright/test');

test('E2E Testing Day 13 Question 1', async ({ page }) => {
    await page.goto('file:///C:/Users/SPURGE/Downloads/Day13_E2EPractice_DemoSite.html');
    
    // Login steps
    await page.locator('#username').fill('testuser');
    await page.locator('#password').fill('testpassword');
    await page.locator('#loginBtn').click();
    
    // Search for "Wallet"
    await page.locator('#searchInput').fill('Wallet');
    await page.locator('#searchBtn').click();
    
    // Wait for the results summary to NOT contain "Searching…"
    await expect(page.locator('#resultsSummary')).not.toContainText('Searching…');
    
    // Fetch the text content
    const summaryText = await page.locator('#resultsSummary').textContent();
    
    // --- UPDATED CONDITION ---
    // Checking for the exact text displayed after the search is complete.
    // I added a check for both "Wallet" and "wallet" in case the site makes your search lowercase.
    if (summaryText && (summaryText.trim() === 'Showing 1 result for "Wallet" — Staging (10 products)' || summaryText.trim() === 'Showing 1 result for "wallet" — Staging (10 products)')) {
        console.log('Test passed! Search results successfully validated.');
    } else {
        console.log(`Test failed! Status displayed -> ${summaryText}`);
    }
});