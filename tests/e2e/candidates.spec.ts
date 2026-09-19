import { test, expect } from '@playwright/test'
test('search, pagination, server filters, saved preferences, and empty state', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Chloé Blanchard', { exact: true })).toBeVisible()
  await expect(page.locator('tbody tr')).toHaveCount(8)
  const pageSize = page.getByRole('spinbutton', { name: 'Candidates per page' })
  await pageSize.fill('5')
  await page.waitForTimeout(200)
  await expect(page.locator('tbody tr')).toHaveCount(8)
  await expect(page.locator('tbody tr')).toHaveCount(5)
  await pageSize.fill('2')
  await pageSize.press('Enter')
  await expect(pageSize).toHaveValue('5')
  await expect(page.locator('tbody tr')).toHaveCount(5)
  await pageSize.fill('500')
  await pageSize.press('Enter')
  await expect(pageSize).toHaveValue('100')
  await expect(page.locator('tbody tr')).toHaveCount(12)
  await pageSize.fill('8')
  await pageSize.press('Enter')
  await expect(page.locator('tbody tr')).toHaveCount(8)
  await page.getByRole('button', { name: 'Next page', exact: true }).click()
  await expect(page.locator('tbody tr')).toHaveCount(4)
  await page.getByRole('textbox', { name: 'Search candidates' }).fill('Sophie')
  await expect(page.locator('tbody tr')).toHaveCount(1)
  await page.getByRole('button', { name: 'Clear all filters' }).click()
  await page.getByRole('button', { name: 'Filters', exact: true }).click()
  await page.getByRole('combobox', { name: 'Skill', exact: true }).selectOption('Pinia')
  await expect(page.locator('tbody tr')).toHaveCount(1)
  await expect(page.getByText('Emma Leroy', { exact: true })).toBeVisible()
  await page
    .getByRole('combobox', { name: 'Position', exact: true })
    .selectOption('Développeur Vue.js')
  await page.getByLabel('Applied from').fill('2024-01-10')
  await page.getByLabel('Applied until').fill('2024-01-10')
  await expect(page.getByText('Emma Leroy', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText('Emma Leroy', { exact: true })).toBeVisible()
  await page.getByRole('textbox', { name: 'Search candidates' }).fill('does-not-exist-123')
  await expect(page.getByText('No candidates found')).toBeVisible()
})
test('full CRUD, notes, keyboard stage change, and persistence', async ({ page }) => {
  await page.goto('/candidatures/nouvelle')
  await page.getByLabel('Full name').fill('1234')
  await page.getByLabel('Email address').fill('not-an-email')
  await page.getByLabel('Phone number').fill('letters')
  await page.getByLabel('Location').fill('12345')
  await page.getByLabel('Experience').fill('many')
  await page.getByLabel('Expected annual salary').fill('-10')
  await page.getByLabel('Application date').fill('2999-01-01')
  await page.getByLabel('CV link').fill('javascript:alert(1)')
  await page.getByRole('button', { name: 'Add candidate', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Review the highlighted fields')
  await expect(page.getByText('Enter a valid email address.')).toBeVisible()
  await expect(page.getByText('Use only digits and common phone symbols.')).toBeVisible()
  await expect(page.getByText('The application date cannot be in the future.')).toBeVisible()

  await page.getByLabel('Full name').fill('QA Candidate')
  await page.getByLabel('Email address').fill('qa@example.com')
  await page.getByLabel('Phone number').fill('+33 6 12 34 56 78')
  await page.getByLabel('Location').fill('Paris, France')
  await page.getByLabel('Experience').fill('3 years')
  await page.getByLabel('Expected annual salary').fill('50000')
  await page.getByLabel('Application date').fill('2024-01-10')
  await page.getByLabel('CV link').fill('https://example.com/qa-candidate.pdf')
  await page.getByLabel('Position', { exact: false }).selectOption('Développeur Vue.js')
  await page.getByLabel('Skills', { exact: false }).fill('Vue.js, TypeScript')
  await page.getByRole('button', { name: 'Add candidate', exact: true }).click()
  await expect(page).toHaveURL(/\/candidatures$/)
  await expect(
    page.locator('[data-sonner-toast][data-type="success"]').filter({ hasText: 'Candidate added' }),
  ).toBeVisible()
  await page.getByRole('textbox', { name: 'Search candidates' }).fill('qa@example.com')
  await page.getByRole('link', { name: 'View QA Candidate', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'QA Candidate' })).toBeVisible()
  await page.getByLabel('Current stage').selectOption('Entretien RH')
  await expect(page.getByLabel('Current stage')).toBeEnabled()
  await page.getByLabel('Your name').fill('QA Recruiter')
  await page.getByLabel('Add a note').fill('Promising profile, follow up tomorrow.')
  await page.getByRole('button', { name: 'Add note', exact: true }).click()
  await expect(page.getByText('Promising profile, follow up tomorrow.')).toBeVisible()
  await page.getByRole('link', { name: 'Edit profile' }).click()
  await page.getByLabel('Full name').fill('QA Updated')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByRole('heading', { name: 'QA Updated' })).toBeVisible()
  await page.reload()
  await expect(page.getByText('Promising profile, follow up tomorrow.')).toBeVisible()
  await expect(page.getByLabel('Current stage')).toHaveValue('Entretien RH')
  await page.getByRole('button', { name: 'Delete candidate', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByRole('heading', { name: 'QA Updated' })).toBeVisible()
  await page.getByRole('button', { name: 'Delete candidate', exact: true }).click()
  let releaseRefresh!: () => void
  const refreshGate = new Promise<void>((resolve) => {
    releaseRefresh = resolve
  })
  await page.route('**/candidatures?*', async (route) => {
    await refreshGate
    await route.continue()
  })
  await page.getByRole('dialog').getByRole('button', { name: 'Delete candidate' }).click()
  try {
    await expect(page).toHaveURL(/\/candidatures$/, { timeout: 2000 })
    await expect(
      page
        .locator('[data-sonner-toast][data-type="success"]')
        .filter({ hasText: 'Candidate deleted' }),
    ).toBeVisible()
  } finally {
    releaseRefresh()
  }
  await page.unroute('**/candidatures?*')
  await page.getByRole('textbox', { name: 'Search candidates' }).fill('qa@example.com')
  await expect(page.getByText('No candidates found')).toBeVisible()
})
test('board drag and drop writes a stage change', async ({ page, request }) => {
  await page.setViewportSize({ width: 1800, height: 1000 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Board view', exact: true }).click()
  const source = page.locator('.board-card').filter({ hasText: 'Chloé Blanchard' })
  await source.dragTo(page.getByRole('region', { name: 'Hired', exact: true }), {
    sourcePosition: { x: 20, y: 20 },
    targetPosition: { x: 45, y: 100 },
  })
  await expect(page.getByLabel('Stage for Chloé Blanchard')).toHaveValue('Accepté')
  await expect
    .poll(
      async () =>
        (await (await request.get('http://127.0.0.1:3002/candidatures/11')).json()).statut,
    )
    .toBe('Accepté')
  await request.patch('http://127.0.0.1:3002/candidatures/11', { data: { statut: 'En attente' } })
})
test('network failures show retry; missing candidates show a clear message', async ({ page }) => {
  await page.route('**/candidatures?*', (route) => route.abort())
  await page.goto('/')
  await expect(page.getByText('Unable to load this content')).toBeVisible()
  await page.unroute('**/candidatures?*')
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(page.locator('tbody tr')).toHaveCount(8)
  await page.goto('/candidatures/99999')
  await expect(
    page.getByText('This candidate could not be found or has been deleted.'),
  ).toBeVisible()
})

test('failed optimistic stage update rolls back and explains the failure', async ({ page }) => {
  await page.goto('/candidatures/1')
  await expect(page.getByLabel('Current stage')).toHaveValue('En attente')
  await page.route('**/candidatures/1', async (route) => {
    if (route.request().method() === 'PATCH') await route.fulfill({ status: 500, body: '{}' })
    else await route.continue()
  })
  await page.getByLabel('Current stage').selectOption('Accepté')
  await expect(page.getByLabel('Current stage')).toHaveValue('En attente')
  await expect(page.locator('[data-sonner-toast][data-type="error"]')).toContainText(
    'server is having trouble',
  )
})

test('breadcrumbs support direct links, edit, create and back navigation; header follows scroll direction', async ({
  page,
}) => {
  await page.goto('/candidatures/1/modifier')
  const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb', exact: true })
  expect(await breadcrumb.evaluate((element) => element.closest('header') === null)).toBe(true)
  await expect(breadcrumb.getByRole('link', { name: 'Sophie Martin', exact: true })).toBeVisible()
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText('Edit')
  await breadcrumb.getByRole('link', { name: 'Sophie Martin', exact: true }).click()
  await expect(page).toHaveURL(/\/candidatures\/1$/)
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText('Sophie Martin')
  await breadcrumb.getByRole('link', { name: 'Candidates', exact: true }).click()
  await expect(page).toHaveURL(/\/candidatures$/)
  await page.getByRole('link', { name: 'Add candidate', exact: true }).click()
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText('Add candidate')
  await breadcrumb.getByRole('link', { name: 'Candidates', exact: true }).click()
  await page.setViewportSize({ width: 1280, height: 500 })
  await expect(page.locator('tbody tr')).toHaveCount(8)
  await page.getByRole('heading', { name: 'Candidates', exact: true }).click()
  await page.evaluate(() => window.scrollTo(0, 400))
  await expect(page.getByRole('banner')).toHaveClass(/topbar-hidden/)
  await page.evaluate(() => window.scrollTo(0, 250))
  await expect(page.getByRole('banner')).not.toHaveClass(/topbar-hidden/)
  expect(
    await page.getByRole('banner').evaluate((el) => el.getBoundingClientRect().height),
  ).toBeCloseTo(56)
  await expect(page.getByLabel('Signed in as Your workspace')).toBeVisible()
})

test('failed delete stays on profile and displays a Sonner error', async ({ page }) => {
  await page.goto('/candidatures/1')
  await expect(page.getByRole('heading', { name: 'Sophie Martin' })).toBeVisible()
  await page.route('**/candidatures/1', async (route) => {
    if (route.request().method() === 'DELETE') await route.fulfill({ status: 500, body: '{}' })
    else await route.continue()
  })
  await page.getByRole('button', { name: 'Delete candidate', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete candidate' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page).toHaveURL(/\/candidatures\/1$/)
  await expect(page.locator('[data-sonner-toast][data-type="error"]')).toContainText(
    'server is having trouble',
  )
})
test('desktop, dark mode and mobile screenshots without page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.goto('/')
  await expect(page.locator('tbody tr')).toHaveCount(8)
  await page.screenshot({ path: 'docs/screenshots/candidates-light.png', fullPage: true })
  await page.getByRole('button', { name: 'Switch to dark mode' }).click()
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.screenshot({ path: 'docs/screenshots/candidates-dark.png', fullPage: true })
  await page.getByRole('button', { name: 'Switch to light mode' }).click()
  await page.getByRole('link', { name: 'View Chloé Blanchard', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Chloé Blanchard' })).toBeVisible()
  await page.screenshot({ path: 'docs/screenshots/candidate-profile.png', fullPage: true })
  await page.goto('/')
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.locator('tbody tr')).toHaveCount(8)
  await page.screenshot({ path: 'docs/screenshots/candidates-mobile.png', fullPage: true })
  const overflow = await page.evaluate(() => ({
    width: innerWidth,
    actual: document.documentElement.scrollWidth,
    elements: [...document.querySelectorAll('body *')]
      .filter(
        (el) =>
          el.getBoundingClientRect().right > innerWidth &&
          !el.closest('.table-scroll, .status-tabs'),
      )
      .map((el) => ({
        tag: el.tagName,
        class: el.className,
        width: el.getBoundingClientRect().width,
      }))
      .slice(0, 15),
  }))
  expect(overflow.actual, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.width)
})
