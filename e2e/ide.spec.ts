import { test, expect } from '@playwright/test';

test.describe('Online IDE V1 - Critical Workflows', () => {
  test('create/open project -> create/edit a file -> save -> reload browser -> verify persistence', async ({
    page,
  }) => {
    // 1. Open the application
    await page.goto('/');

    // Verify app title and default starter files in tree
    await expect(page.getByText('Online IDE', { exact: true })).toBeVisible();
    await expect(page.getByText('index.html').first()).toBeVisible();
    await expect(page.getByText('style.css').first()).toBeVisible();
    await expect(page.getByText('script.js').first()).toBeVisible();

    // 2. Create a new file 'app.js'
    const newFileBtn = page.locator('button[title="New File (Root)"]');
    await newFileBtn.click();

    const nameInput = page.locator('input[placeholder="New file..."]');
    await nameInput.fill('app.js');
    await nameInput.press('Enter');

    // Verify app.js is created and tab is active
    await expect(page.locator('.truncate', { hasText: 'app.js' }).first()).toBeVisible();

    // 3. Type into editor using keyboard with standard delay
    const monacoLines = page.locator('.monaco-editor .view-lines').first();
    await monacoLines.click();
    await page.keyboard.type('HelloE2E', { delay: 100 });

    // 4. Save project manually via Save button
    const saveBtn = page.locator('button:has-text("Save")');
    await saveBtn.click();
    await expect(page.getByText('Saved')).toBeVisible();

    // 5. Reload browser
    await page.reload();

    // 6. Verify file 'app.js' and its content survive browser reload
    await expect(page.getByText('app.js').first()).toBeVisible();
    await page.getByText('app.js').first().click();

    const editorContent = page.locator('.monaco-editor');
    await expect(editorContent).toContainText('HelloE2E');
  });
});
