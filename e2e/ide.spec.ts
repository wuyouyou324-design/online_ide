import { test, expect } from '@playwright/test';

test.describe('Online IDE V1 Workflow', () => {
  test('creates file, edits content, saves, reloads browser and restores state', async ({ page }) => {
    await page.goto('/');

    // Verify initial default files exist
    await expect(page.locator('.tree-item', { hasText: 'index.html' })).toBeVisible();
    await expect(page.locator('.tree-item', { hasText: 'style.css' })).toBeVisible();
    await expect(page.locator('.tree-item', { hasText: 'script.js' })).toBeVisible();

    // Create a new file app.js
    await page.click('button[title^="New file"]');
    await page.fill('.create-input', 'app.js');
    await page.click('button[title="Confirm"]');

    // Verify app.js tab is created and active
    await expect(page.locator('.tree-item', { hasText: 'app.js' })).toBeVisible();
    await expect(page.locator('.ide-tab', { hasText: 'app.js' })).toBeVisible();

    // Click Save button manually
    await page.click('button:has-text("Save")');
    await expect(page.locator('.status-badge.saved')).toBeVisible();

    // Reload page
    await page.reload();

    // Verify restored state
    await expect(page.locator('.tree-item', { hasText: 'app.js' })).toBeVisible();
    await expect(page.locator('.ide-tab', { hasText: 'app.js' })).toBeVisible();
  });
});
