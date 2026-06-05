import urllib.request
import urllib.error

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

BASE_URL = "http://localhost:5173"

# Table 1 QR token — taken from database/scheme/schema.sql seed data
TABLE_TOKEN = "a3f8c2d1e4b7f09a6c5e2d8b1f4a7c0e3d6b9f2a5c8e1d4b7f0a3c6e9d2b5"

# Dedicated test account with Admin role (created via API, id=8)
ADMIN_EMAIL    = "tester@serviqo.com"
ADMIN_PASSWORD = "Tester1234!"


def pytest_configure(config):
    """Fail fast with a clear message if the frontend server is not running."""
    try:
        urllib.request.urlopen(BASE_URL, timeout=5)
    except urllib.error.URLError:
        pytest.exit(
            f"\n\nFrontend server is not reachable at {BASE_URL}.\n"
            "Start it first:  npm run dev   (from the project root)\n",
            returncode=1,
        )


@pytest.fixture
def driver():
    """Fresh Chrome instance per test — isolates crashes between tests."""
    options = Options()
    # Uncomment the next line to run headlessly in CI:
    # options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1280,900")

    # Selenium 4.6+ includes selenium-manager which auto-downloads the correct
    # ChromeDriver for your installed Chrome version — no extra library needed.
    drv = webdriver.Chrome(options=options)
    drv.implicitly_wait(8)
    yield drv
    drv.quit()


@pytest.fixture
def wait(driver):
    return WebDriverWait(driver, 10)
