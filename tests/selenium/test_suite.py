import time

import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from conftest import BASE_URL, TABLE_TOKEN, ADMIN_EMAIL, ADMIN_PASSWORD


class TestServiqoSuite:

    LOGIN_URL    = f"{BASE_URL}/index.html"
    REGISTER_URL = f"{BASE_URL}/pages/register.html"
    ADMIN_URL    = f"{BASE_URL}/pages/admin.html"
    MENU_URL     = f"{BASE_URL}/pages/menu.html?table={TABLE_TOKEN}"

    # ─────────────────────────── helpers ────────────────────────────

    def _login_as_admin(self, driver, wait):
        driver.get(self.LOGIN_URL)
        time.sleep(1)
        driver.find_element(By.ID, "email").send_keys(ADMIN_EMAIL)
        time.sleep(0.4)
        driver.find_element(By.ID, "password").send_keys(ADMIN_PASSWORD)
        time.sleep(0.4)
        driver.find_element(By.CSS_SELECTOR, "#loginForm button[type='submit']").click()
        wait.until(EC.url_contains("admin.html"))
        time.sleep(2)

    def _open_preview_table(self, driver, wait):
        """Click the Preview Menu button → switch to the new tab, return admin handle."""
        admin_handle = driver.current_window_handle
        driver.find_element(By.PARTIAL_LINK_TEXT, "Preview Menu").click()
        wait.until(lambda d: len(d.window_handles) > 1)
        menu_handle = [h for h in driver.window_handles if h != admin_handle][0]
        driver.switch_to.window(menu_handle)
        time.sleep(2.5)
        return admin_handle

    def _back_to_admin(self, driver, admin_handle):
        """Close the menu tab and return to the admin dashboard, then reload it."""
        driver.close()
        driver.switch_to.window(admin_handle)
        time.sleep(0.5)
        driver.refresh()
        time.sleep(3)   # let dashboard data re-load (4-second polling)

    # test 1: Registration

    def test_1_registration(self, driver, wait):
        unique_email = f"selenium_{int(time.time())}@test.com"

        driver.get(self.REGISTER_URL)
        time.sleep(1)

        driver.find_element(By.ID, "name").send_keys("Selenium Tester")
        time.sleep(0.5)
        driver.find_element(By.ID, "email").send_keys(unique_email)
        time.sleep(0.5)
        driver.find_element(By.ID, "password").send_keys("TestPass1!")
        time.sleep(0.5)
        driver.find_element(By.ID, "confirm").send_keys("TestPass1!")
        time.sleep(0.5)

        driver.find_element(By.CSS_SELECTOR, "#registerForm button[type='submit']").click()

        # JS shows "Account created! Redirecting to login…" for 1.5 s then redirects.
        # Catch the brief success message before the redirect fires.
        success_el = wait.until(
            EC.text_to_be_present_in_element((By.ID, "registerSuccess"), "Account created")
        )
        time.sleep(0.5)

        # After 1.5 s the page redirects to the login page — confirm we land there.
        wait.until(EC.url_contains("index.html"))
        assert "index.html" in driver.current_url, \
            "Successful registration must redirect back to the login page"
        time.sleep(1)

    # test 2: Login

    def test_2_login(self, driver, wait):
        driver.get(self.LOGIN_URL)
        time.sleep(1)

        driver.find_element(By.ID, "email").send_keys(ADMIN_EMAIL)
        time.sleep(0.5)
        driver.find_element(By.ID, "password").send_keys(ADMIN_PASSWORD)
        time.sleep(0.5)

        driver.find_element(By.CSS_SELECTOR, "#loginForm button[type='submit']").click()
        time.sleep(2)

        wait.until(EC.url_contains("admin.html"))
        assert "admin.html" in driver.current_url, "Admin must land on dashboard after login"
        time.sleep(1)

    # test 3: Ordering

    def test_3_ordering(self, driver, wait):
        self._login_as_admin(driver, wait)
        admin_handle = self._open_preview_table(driver, wait)

        # Wait for menu items then add the first one
        first_add = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".btn-add")))
        time.sleep(1)
        first_add.click()
        time.sleep(1)

        # Open the cart drawer
        driver.find_element(By.ID, "btnCart").click()
        time.sleep(1.5)

        wait.until(EC.visibility_of_element_located((By.ID, "cartDrawer")))
        time.sleep(1)

        # Place the order
        driver.find_element(By.ID, "btnSendOrder").click()
        time.sleep(2.5)

        # Order confirmation overlay
        wait.until(EC.visibility_of_element_located((By.ID, "orderConfirm")))
        time.sleep(1.5)
        driver.find_element(By.ID, "orderConfirmClose").click()
        time.sleep(1)

        self._back_to_admin(driver, admin_handle)

        # Verify order appears in Active Orders table
        orders_body = wait.until(EC.presence_of_element_located((By.ID, "ordersTableBody")))
        wait.until(lambda d: "Loading" not in d.find_element(By.ID, "ordersTableBody").text)
        time.sleep(1)
        assert "Table" in orders_body.text, \
            "Placed order must appear in the Active Orders table on the dashboard"

    # test 4: Request Bill

    def test_4_request_bill(self, driver, wait):
        self._login_as_admin(driver, wait)
        admin_handle = self._open_preview_table(driver, wait)

        # Click Request Bill
        bill_btn = wait.until(EC.element_to_be_clickable((By.ID, "btnBill")))
        time.sleep(0.5)
        bill_btn.click()
        time.sleep(2.5)

        # Toast confirms the request was sent
        wait.until(lambda d: d.find_element(By.ID, "toast").text.strip() != "")
        time.sleep(1.5)

        self._back_to_admin(driver, admin_handle)

        # Verify bill request in Pending Requests table
        wait.until(lambda d: "Loading" not in d.find_element(By.ID, "requestsTableBody").text)
        requests_body = driver.find_element(By.ID, "requestsTableBody")
        time.sleep(1)
        assert "Bill" in requests_body.text, \
            "Bill request must appear in the Pending Requests table on the dashboard"

    # test 5: Call a Waiter

    def test_5_call_waiter(self, driver, wait):
        self._login_as_admin(driver, wait)
        admin_handle = self._open_preview_table(driver, wait)

        # Click Call Waiter
        waiter_btn = wait.until(EC.element_to_be_clickable((By.ID, "btnWaiter")))
        time.sleep(0.5)
        waiter_btn.click()
        time.sleep(2.5)

        # Toast confirms the request was sent
        wait.until(lambda d: d.find_element(By.ID, "toast").text.strip() != "")
        time.sleep(1.5)

        self._back_to_admin(driver, admin_handle)

        # Verify waiter request in Pending Requests table
        wait.until(lambda d: "Loading" not in d.find_element(By.ID, "requestsTableBody").text)
        requests_body = driver.find_element(By.ID, "requestsTableBody")
        time.sleep(1)
        assert "Waiter" in requests_body.text, \
            "Waiter request must appear in the Pending Requests table on the dashboard"

    # test 6: Add Menu Item

    def test_6_add_menu_item(self, driver, wait):
        item_name = f"Selenium Burger {int(time.time())}"

        self._login_as_admin(driver, wait)

        # Navigate to Menu Items section via sidebar
        driver.find_element(By.CSS_SELECTOR, "[data-section='menu']").click()
        time.sleep(1.5)

        # Click + Add Item
        add_item_btn = wait.until(EC.element_to_be_clickable(
            (By.XPATH, "//button[contains(text(),'Add Item')]")
        ))
        time.sleep(0.5)
        add_item_btn.click()
        time.sleep(1.5)

        # Fill in the modal form
        wait.until(EC.visibility_of_element_located((By.ID, "menuItemModal")))
        time.sleep(0.5)

        driver.find_element(By.ID, "itemName").send_keys(item_name)
        time.sleep(0.5)
        driver.find_element(By.ID, "itemDesc").send_keys("Added by Selenium automated test")
        time.sleep(0.5)
        driver.find_element(By.ID, "itemPrice").send_keys("12.99")
        time.sleep(0.5)

        # Save the item — wait for modal to close (toast confirms success)
        driver.find_element(By.XPATH, "//button[@onclick='saveMenuItem()']").click()
        wait.until(lambda d: d.find_element(By.ID, "toast").text.strip() != "")
        time.sleep(2)   # let backend finish before opening a new tab

        # Open Preview Menu in a new tab
        admin_handle = self._open_preview_table(driver, wait)

        # Wait for at least one menu item card to load (confirms backend responded)
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".btn-add")))
        time.sleep(1)

        # Search for the newly added item
        search = driver.find_element(By.ID, "menuSearch")
        search.clear()
        search.send_keys(item_name)
        time.sleep(2)

        # Verify the item appears in the menu
        menu_body = driver.find_element(By.ID, "menuBody")
        assert item_name in menu_body.text, \
            f"Newly added item '{item_name}' must be visible in the customer menu"
        time.sleep(1)

        # Clean up the preview tab
        driver.close()
        driver.switch_to.window(admin_handle)
