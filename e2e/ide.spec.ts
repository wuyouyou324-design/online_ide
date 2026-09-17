import { test, expect } from '@playwright/test';

test.describe('Online IDE V1 Workflow', () => {
  test('creates/opens project -> edits file -> saves -> reloads browser -> verifies persistence', async ({ page }) => {
    // 1. Launch the IDE
    await page.goto('/');

    // Verify root directory node and initial files in file explorer
    await expect(page.getByTestId('file-node-my-project')).toBeVisible();
    await expect(page.getByTestId('file-node-index.html')).toBeVisible();
    await expect(page.getByTestId('file-node-style.css')).toBeVisible();
    await expect(page.getByTestId('file-node-script.js')).toBeVisible();

    // Verify initial tabs are present
    await expect(page.getByTestId('tab-index.html')).toBeVisible();

    // 2. Open File Explorer root options and create a new file "app.ts"
    const rootItem = page.getByTestId('file-node-my-project');
    await rootItem.hover();

    // Click "New File in Root"
    await page.getByTitle('New File in Root').click();

    // Fill modal form to create file
    await page.fill('input[placeholder="e.g., style.css"]', 'app.ts');
    await page.click('button[type="submit"]:has-text("Save")');

    // Verify app.ts appeared in explorer and as active tab
    await expect(page.getByTestId('file-node-app.ts')).toBeVisible();
    await expect(page.getByTestId('tab-app.ts')).toBeVisible();

    // 3. Force save state using Save button
    await page.click('button:has-text("Save")');

    // Verify status indicates "Saved"
    await expect(page.getByText('Saved')).toBeVisible();

    // 4. Reload browser page
    await page.reload();

    // 5. Verify file system and created file remain available after reload
    await expect(page.getByTestId('file-node-my-project')).toBeVisible();
    await expect(page.getByTestId('file-node-app.ts')).toBeVisible();
    await expect(page.getByTestId('tab-app.ts')).toBeVisible();
  });
});
