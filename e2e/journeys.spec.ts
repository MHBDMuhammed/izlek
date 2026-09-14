import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/#onboarding");
});

test("onboardingden ilk ders pratigine", async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: /senin okuman/i }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /kendi başlangıcımı/i })
    .click();
  await expect(page).toHaveURL(/#assessment\/baseline/);
  await page
    .getByRole("button", { name: /hazırlığa geç/i })
    .click();
  await expect(page).toHaveURL(/#reader\//);
  await expect(
    page.getByRole("heading", { name: /doğal okuma/i }),
  ).toBeVisible();
  await page.getByRole("button", { name: /okumayı başlat/i }).click();
  await page.getByRole("button", { name: /metni bitirdim/i }).click();
  const radios = page.locator('input[type="radio"]');
  expect(await radios.count()).toBeGreaterThan(0);
  const total = await radios.count();
  for (let i = 0; i < total; i += 4) {
    await radios.nth(i).check({ force: true });
  }
  await page.getByRole("button", { name: /sonucu gör/i }).click();
  await expect(
    page.getByRole("heading", { name: /yeni bir gözlem|izini korudun/i }),
  ).toBeVisible();
});

test("kitap konumu yenilemede korunur", async ({ page }) => {
  await page.goto("/#book/l05");
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(900);
  await page.reload();
  await expect(page).toHaveURL(/#book\/l05/);
  await expect(
    page.getByRole("heading", { name: /türkçenin küçük dönemeçleri/i }),
  ).toBeVisible();
});

test("kendi metni sorusuz ve saklanabilir", async ({ page }) => {
  await page.goto("/#custom");
  const body =
    "Birinci cümle grubu burada başlıyor ve yeterince uzuyor. " +
    "İkinci cümle de aynı düşünceyi başka sözcüklerle sürdürüyor ve tamamlıyor.";
  await page.locator("textarea").first().fill(`${body}\n\n${body}`);
  await page.getByRole("button", { name: /çalışma alanına geç/i }).click();
  await expect(page.getByText(/hazır soruları yok/i)).toBeVisible();
});

test("sıfırlama bilinçli onay ister", async ({ page }) => {
  await page.goto("/#settings");
  await page.getByRole("button", { name: /yerel ilerlemeyi sıfırla/i }).click();
  await expect(
    page.getByRole("alertdialog"),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("alertdialog")).toBeHidden();
});
