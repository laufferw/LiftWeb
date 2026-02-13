import { test, expect } from "@playwright/test";

test("home loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Lift out loud." })).toBeVisible();
});

test("login loads", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("log form loads", async ({ page }) => {
  await page.goto("/log/new");
  await expect(page.getByRole("heading", { name: "Log a workout" })).toBeVisible();
});

test("workouts page loads", async ({ page }) => {
  await page.goto("/workouts");
  await expect(page.getByRole("heading", { name: "Workouts" })).toBeVisible();
});

test("lifts page loads", async ({ page }) => {
  await page.goto("/lifts");
  await expect(page.getByRole("heading", { name: "Lifts" })).toBeVisible();
});
