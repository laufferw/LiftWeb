import { test, expect } from "@playwright/test";

test("home loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Lift out loud." })).toBeVisible();
});

test("login loads", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("explore has discovery UI", async ({ page }) => {
  await page.goto("/explore");
  await expect(page.getByRole("heading", { name: "Explore the community" })).toBeVisible();
  await expect(page.getByPlaceholder("Search by lift, user, note, or tag")).toBeVisible();
});

test("guarded routes show access/setup states", async ({ page }) => {
  await page.goto("/lifts");
  await expect(page.getByRole("heading", { name: "Lifts" })).toBeVisible();
  await expect(
    page.getByText(/Supabase is not configured|Sign in to continue|Finish profile setup first/),
  ).toBeVisible();

  await page.goto("/workouts");
  await expect(page.getByRole("heading", { name: "Workouts" })).toBeVisible();
  await expect(
    page.getByText(/Supabase is not configured|Sign in to continue|Finish profile setup first/),
  ).toBeVisible();
});
