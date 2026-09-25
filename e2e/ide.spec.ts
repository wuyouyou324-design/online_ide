import { test, expect } from '@playwright/test';

test.describe('Online IDE V1 E2E Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear localStorage before each test for predictable clean state
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('default starter files load, tabs render, and preview renders', async ({ page }) => {
    await expect(page.getByText('Browser IDE V1')).toBeVisible();

    // Explorer tree items
    const explorer = page.locator('.w-64');
    await expect(explorer.getByText('index.html')).toBeVisible();
    await expect(explorer.getByText('style.css')).toBeVisible();
    await expect(explorer.getByText('script.js')).toBeVisible();

    // Verify HTML preview iframe contains expected content
    const iframe = page.frameLocator('iframe[title="HTML Preview"]');
    await expect(iframe.getByRole('heading', { name: 'Hello, World!' })).toBeVisible();
  });

  test('create, edit file, save, reload browser, and verify persistence', async ({ page }) => {
    const explorer = page.locator('.w-64');

    // 1. Create a new file "app.js"
    await page.getByTitle('New file in /').first().click();
    await page.getByPlaceholder('filename.ext').fill('app.js');
    await page.getByRole('button', { name: 'Confirm' }).click();

    // Verify app.js appears in file explorer
    await expect(explorer.getByText('app.js')).toBeVisible();

    // 2. Click Save button to persist state to LocalStorage
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText(/Saved \(/)).toBeVisible();

    // 3. Reload browser page
    await page.reload();

    // 4. Assert app.js remains available in File Explorer after reload
    await expect(explorer.getByText('app.js')).toBeVisible();
  });

  test('create folder, nested file, rename and delete operations', async ({ page }) => {
    const explorer = page.locator('.w-64');

    // 1. Create folder "src"
    await page.getByTitle('New folder in /').first().click();
    await page.getByPlaceholder('folder-name').fill('src');
    await page.getByRole('button', { name: 'Confirm' }).click();

    const srcFolderRow = explorer.getByText('src');
    await expect(srcFolderRow).toBeVisible();

    // Click src folder to select it
    await srcFolderRow.click();

    // 2. Create file inside "src" folder using toolbar "New file in /src" button
    await page.getByTitle('New file in /src').click();
    await page.getByPlaceholder('filename.ext').fill('helper.js');
    await page.getByRole('button', { name: 'Confirm' }).click();

    await expect(explorer.getByText('helper.js')).toBeVisible();

    // 3. Rename "helper.js" to "utils.js"
    await page.getByTitle('Rename helper.js').click();
    await page.getByPlaceholder('filename.ext').fill('utils.js');
    await page.getByRole('button', { name: 'Confirm' }).click();

    await expect(explorer.getByText('utils.js')).toBeVisible();

    // 4. Delete folder "src" with confirmation modal
    await page.getByTitle('Delete src').click();
    await expect(page.getByText('Confirm Folder Deletion')).toBeVisible();
    await page.getByRole('button', { name: 'Delete Folder' }).click();

    // Verify folder and nested file are gone
    await expect(explorer.getByText('src')).toHaveCount(0);
    await expect(explorer.getByText('utils.js')).toHaveCount(0);
  });
});
