import { test, expect } from '@playwright/test';

// Use unauthenticated context for auth tests to avoid interfering with other tests
const authTest = test.extend({
  storageState: { cookies: [], origins: [] },
});

authTest.describe.configure({ mode: 'serial' });

authTest.describe('Admin Authentication', () => {
  authTest(
    'should redirect unauthenticated users to login',
    async ({ page }) => {
      // Try to access admin dashboard without being logged in
      await page.goto('http://localhost:3000/admin');

      // Should redirect to login with redirect parameter
      await expect(page).toHaveURL(/\/login\?redirect=%2Fadmin/);
      await expect(page.getByText('Admin Login')).toBeVisible();
    }
  );

  authTest('should show error for invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    // Fill in invalid credentials
    await page
      .getByRole('textbox', { name: 'Email' })
      .fill('wrong@example.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should show error message
    await expect(page.getByText(/invalid login credentials/i)).toBeVisible();

    // Should still be on login page
    await expect(page).toHaveURL('http://localhost:3000/login');
  });

  authTest(
    'should login with valid admin credentials and access dashboard',
    async ({ page }) => {
      // Note: This test requires a valid admin user in Supabase
      // with email matching ADMIN_EMAILS env var
      const adminEmail = process.env.ADMIN_EMAIL || 'banykinv@gmail.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'banych1993';

      await page.goto('http://localhost:3000/login');

      // Fill in valid admin credentials
      await page.getByRole('textbox', { name: 'Email' }).fill(adminEmail);
      await page.getByRole('textbox', { name: 'Password' }).fill(adminPassword);
      await page.getByRole('button', { name: 'Sign In' }).click();

      // Should redirect to admin dashboard
      await expect(page).toHaveURL('http://localhost:3000/admin');
      await expect(
        page.getByRole('heading', { name: 'Admin Dashboard' })
      ).toBeVisible();

      // Should show user email in header
      await expect(page.getByText(adminEmail)).toBeVisible();

      // Should show navigation links in header
      await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
      await expect(
        page.getByRole('banner').getByRole('link', { name: 'Quizzes' })
      ).toBeVisible();
    }
  );

  authTest('should logout and redirect to login page', async ({ page }) => {
    const adminEmail = process.env.ADMIN_EMAIL || 'banykinv@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'banych1993';

    // Login first
    await page.goto('http://localhost:3000/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(adminEmail);
    await page.getByRole('textbox', { name: 'Password' }).fill(adminPassword);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Wait for dashboard to load
    await expect(page).toHaveURL('http://localhost:3000/admin');

    // Click logout button
    await page.getByRole('button', { name: 'Logout' }).click();

    // Should redirect to login page
    await expect(page).toHaveURL('http://localhost:3000/login');
    await expect(page.getByText('Admin Login')).toBeVisible();
  });

  authTest(
    'should redirect to originally requested page after login',
    async ({ page }) => {
      const adminEmail = process.env.ADMIN_EMAIL || 'banykinv@gmail.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'banych1993';

      // Try to access /admin/quizzes without being logged in
      await page.goto('http://localhost:3000/admin/quizzes');

      // Should redirect to login with redirect parameter
      await expect(page).toHaveURL(/\/login\?redirect=%2Fadmin%2Fquizzes/);

      // Login
      await page.getByRole('textbox', { name: 'Email' }).fill(adminEmail);
      await page.getByRole('textbox', { name: 'Password' }).fill(adminPassword);
      await page.getByRole('button', { name: 'Sign In' }).click();

      // Should redirect to originally requested page
      await expect(page).toHaveURL('http://localhost:3000/admin/quizzes');
      await expect(
        page.getByRole('heading', { name: 'Quizzes' })
      ).toBeVisible();
    }
  );

  authTest('should persist session across page reloads', async ({ page }) => {
    const adminEmail = process.env.ADMIN_EMAIL || 'banykinv@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'banych1993';

    // Login
    await page.goto('http://localhost:3000/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(adminEmail);
    await page.getByRole('textbox', { name: 'Password' }).fill(adminPassword);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('http://localhost:3000/admin');

    // Wait for cookies to settle and session to be fully established
    await page.waitForTimeout(2000);

    // Reload page
    await page.reload();

    // Should still be on admin dashboard (session persisted)
    await expect(page).toHaveURL('http://localhost:3000/admin');
    await expect(page.getByText('Admin Dashboard')).toBeVisible();
  });
});
