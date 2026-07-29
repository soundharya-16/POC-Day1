const { test, expect } = require('@playwright/test');

test('Handle attached but hidden calendar on real site', async ({ page }) => {
  // Navigate to the real jQuery UI datepicker demo
  await page.goto('https://jqueryui.com/datepicker/');

  // The application is hosted inside an iframe on this page, 
  // so we route our locators through the frame.
  const frame = page.frameLocator('.demo-frame');
  const dateInput = frame.locator('#datepicker');
  const calendarContainer = frame.locator('#ui-datepicker-div');

  // 1. Wait for the calendar to be structurally present in the HTML.
  // This passes immediately because the node exists (even though it is invisible).
  // If we used { state: 'visible' } here, the test would time out and fail.
  await calendarContainer.waitFor({ state: 'attached' });
  console.log('Confirmed: Calendar DOM node is attached (but hidden).');

  // 2. Click the input field to trigger the application's JavaScript to show the calendar
  await dateInput.click();

  // 3. Now wait for the CSS to change and the element to become visually actionable
  await calendarContainer.waitFor({ state: 'visible' });
  console.log('Confirmed: Calendar is now visually rendered on screen.');

  // 4. Select a specific date (e.g., the 21st)
  // Using a regex filter ensures we click exactly "21" and not "21" from a previous/next month fade
  await frame.locator('.ui-state-default')
    .filter({ hasText: /^21$/ })
    .click();

  // 5. Assert the selected date populated the input field
  const selectedDate = await dateInput.inputValue();
  expect(selectedDate).not.toBe('');
  console.log(`Test passed! Captured date: ${selectedDate}`);
});