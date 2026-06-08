import random
import time

from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from config import APP_CONFIG
from pipeline.deduplicator import get_job_id, hash_job_url, is_passed, is_seen, mark_passed
from queue_manager import enqueue_job
from services.logging_utils import get_logger, log_cycle_summary, log_iteration_summary
from services.storage import job_exists


logger = get_logger("scraper.indeed")
SCRAPER_CONFIG = APP_CONFIG["scrapers"]
INDEED_CONFIG = SCRAPER_CONFIG["indeed"]

JOB_KEYWORDS = SCRAPER_CONFIG["keywords"]
LOCATION = INDEED_CONFIG["location"]


class IndeedVerificationError(Exception):
    pass


def random_pause(min_seconds=1.0, max_seconds=3.0):
    time.sleep(random.uniform(min_seconds, max_seconds))


def create_driver():
    options = Options()
    options.add_argument("--start-maximized")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument(f"--user-data-dir={INDEED_CONFIG['chrome_profile_dir']}")
    options.add_argument(f"--profile-directory={INDEED_CONFIG['chrome_profile_name']}")
    return webdriver.Chrome(options=options)


def is_verification_page(driver):
    try:
        current_url = driver.current_url.lower()
        page_source = driver.page_source.lower()

        # HIGH CONFIDENCE signals (Cloudflare challenge)
        strong_markers = [
            "additional verification required"
        ]

        # # URL-based detection (very reliable)
        # if "pagead/clk" in current_url:
        #     return True

        # Check for strong markers only
        if any(marker in page_source for marker in strong_markers):
            return True

        return False

    except Exception:
        return False

def get_next_page_button(driver, timeout=10):
    def locate_visible_next_button(current_driver):
        buttons = current_driver.find_elements(By.XPATH, "//a[@aria-label='Next Page']")
        for button in buttons:
            try:
                if (
                    button.is_displayed()
                    and button.is_enabled()
                    and button.size["width"] > 0
                    and button.size["height"] > 0
                ):
                    return button
            except Exception:
                continue
        return False

    return WebDriverWait(driver, timeout).until(locate_visible_next_button)


def get_visible_job_links(driver):
    visible_jobs = []
    job_elements = driver.find_elements(By.XPATH, "//a[@data-jk]")

    for element in job_elements:
        try:
            job_id = element.get_attribute("data-jk")
            href = element.get_attribute("href")
            title = element.text.strip()
            if (
                job_id
                and href
                and element.is_displayed()
                and element.is_enabled()
                and element.size["width"] > 0
                and element.size["height"] > 0
            ):
                visible_jobs.append({
                    "job_id": job_id,
                    "href": href,
                    "title": title,
                })
        except Exception:
            continue

    unique_jobs = []
    seen_job_ids = set()
    for job in visible_jobs:
        if job["job_id"] in seen_job_ids:
            continue
        seen_job_ids.add(job["job_id"])
        unique_jobs.append(job)
    return unique_jobs


def find_job_link_element(driver, job_info, timeout=10):
    job_id = job_info.get("job_id")

    def locate_job(current_driver):
        candidates = current_driver.find_elements(By.XPATH, f"//a[@data-jk='{job_id}']")
        for candidate in candidates:
            try:
                if (
                    candidate.is_displayed()
                    and candidate.is_enabled()
                    and candidate.size["width"] > 0
                    and candidate.size["height"] > 0
                ):
                    return candidate
            except Exception:
                continue
        return False

    return WebDriverWait(driver, timeout).until(locate_job)


def human_scroll(driver, target_element):
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", target_element)
    random_pause(0.8, 1.8)
    target_y = target_element.location["y"]
    current_y = driver.execute_script("return window.pageYOffset;")

    while current_y < target_y:
        step = random.randint(150, 400)
        driver.execute_script(f"window.scrollBy(0, {step});")
        random_pause(0.4, 1.3)
        current_y += step

        if random.random() < 0.2:
            back = random.randint(50, 120)
            driver.execute_script(f"window.scrollBy(0, -{back});")
            random_pause(0.2, 0.6)

    driver.execute_script("window.scrollBy(0, 80);")
    random_pause(0.2, 0.5)


def human_move_and_click(driver, element):
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", element)
    WebDriverWait(driver, 10).until(
        lambda current_driver: element.is_displayed()
        and element.is_enabled()
        and element.size["width"] > 0
        and element.size["height"] > 0
    )
    random_pause(1.0, 2.5)
    driver.execute_script("arguments[0].click();", element)
    random_pause(1.5, 3.5)


def wait_for_job_content(driver, timeout=20):
    def content_loaded(current_driver):
        if is_verification_page(current_driver):
            return "verification"

        description = current_driver.find_elements(By.ID, "jobDescriptionText")
        if description:
            return "description"

        return False

    return WebDriverWait(driver, timeout).until(content_loaded)


def get_job_description(driver):
    soup = BeautifulSoup(driver.page_source, "html.parser")
    desc_div = soup.find("div", id="jobDescriptionText")
    if desc_div:
        return desc_div.get_text(separator="\n", strip=True)
    return ""


def get_detail_location(driver):
    try:
        location_elem = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//div[@data-testid='inlineHeader-companyLocation']"))
        )
        return location_elem.text.strip()
    except Exception:
        return ""


def get_salary(driver):
    selectors = [
        (By.ID, "salaryInfoAndJobType"),
        (By.XPATH, "//div[@id='salaryInfoAndJobType']//span"),
        (By.XPATH, "//span[contains(text(), '₹')]"),
    ]
    for by, selector in selectors:
        try:
            element = driver.find_element(by, selector)
            text = element.text.strip()
            if text:
                return text
        except Exception:
            continue
    return ""


def get_company_name(driver):
    selectors = [
        (By.XPATH, "//div[@data-testid='inlineHeader-companyName']"),
        (By.CSS_SELECTOR, "[data-testid='company-name']"),
    ]
    for by, selector in selectors:
        try:
            element = driver.find_element(by, selector)
            text = element.text.strip()
            if text:
                return text
        except Exception:
            continue
    return "Unknown"


def Indeed():
    driver = create_driver()
    seen_urls = set()

    try:
        while True:
            total_jobs_found = 0
            fresh_jobs = 0
            cycle_start = time.time()

            try:
                for keyword in JOB_KEYWORDS:
                    iteration_jobs_found = 0
                    iteration_fresh_jobs = 0
                    verification_skips = 0
                    iteration_start = time.time()
                    page_number = 1
                    url = (
                        f"https://in.indeed.com/jobs?q={keyword.replace(' ', '+')}"
                        f"&l={LOCATION.replace(' ', '+').replace(',', '%2C')}"
                        f"&fromage={INDEED_CONFIG['days_old']}&radius={INDEED_CONFIG['radius']}"
                    )

                    driver.get(url)
                    random_pause(4.0, 7.0)

                    while True:
                        try:
                            random_pause(2.0, 5.0)
                            WebDriverWait(driver, 10).until(
                                EC.presence_of_all_elements_located((By.CSS_SELECTOR, "li.css-1ac2h1w"))
                            )
                            soup = BeautifulSoup(driver.page_source, "html.parser")
                            job_cards = driver.find_elements(
                                        By.XPATH, "//div[contains(@class,'job_seen_beacon')]"
                                        )
                            iteration_jobs_found += len(job_cards)

                            for job_info in get_visible_job_links(driver):
                                try:
                                    url_hash = hash_job_url(job_info["href"])
                                    if job_info["href"] in seen_urls or is_passed(url_hash) or job_exists(job_info["href"]):
                                        continue

                                    seen_urls.add(job_info["href"])

                                    job = find_job_link_element(driver, job_info)
                                    human_scroll(driver, job)
                                    human_move_and_click(driver, job)

                                    load_state = wait_for_job_content(driver, timeout=25)
                                    if load_state == "verification":
                                        seen_urls.discard(job_info["href"])
                                        verification_skips += 1
                                        logger.warning(
                                            "Indeed verification page detected for keyword '%s' page %s. Restarting driver.",
                                            keyword,
                                            page_number,
                                        )
                                        raise IndeedVerificationError(
                                            f"Verification page detected for keyword '{keyword}' page {page_number}"
                                        )

                                    random_pause(2.0, 4.5)
                                    description = get_job_description(driver)
                                    if not description:
                                        seen_urls.discard(job_info["href"])
                                        continue

                                    company_name = get_company_name(driver)
                                    location = get_detail_location(driver) or LOCATION
                                    salary = get_salary(driver)
                                    enriched_description = f"Salary: {salary}\n\n{description}" if salary else description

                                    content_job_id = get_job_id(job_info["title"], company_name, enriched_description)
                                    if is_seen(content_job_id):
                                        continue

                                    job_data = {
                                        "job_url": job_info["href"],
                                        "experience_required": "Not mentioned",
                                        "job_title": job_info["title"],
                                        "company_name": company_name,
                                        "location": location,
                                        "job_description": enriched_description,
                                        "source": "Indeed",
                                    }

                                    if job_exists(job_data["job_url"]):
                                        continue

                                    if enqueue_job(job_data):
                                        mark_passed(url_hash)
                                        iteration_fresh_jobs += 1
                                        fresh_jobs += 1
                                    else:
                                        seen_urls.discard(job_info["href"])
                                except Exception:
                                    seen_urls.discard(job_info["href"])
                                    logger.exception(
                                        "Indeed job processing failed | keyword=%s | page=%s | job=%s",
                                        keyword,
                                        page_number,
                                        job_info.get("title", "unknown"),
                                    )

                            try:
                                next_btn = get_next_page_button(driver)
                            except Exception:
                                break

                            driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", next_btn)
                            random_pause(1.5, 3.5)
                            driver.execute_script("arguments[0].click();", next_btn)
                            WebDriverWait(driver, 10).until(EC.staleness_of(next_btn))
                            page_number += 1
                            random_pause(5.0, 12.0)
                        except IndeedVerificationError:
                            raise
                        except Exception:
                            logger.exception("Indeed page processing failed | keyword=%s | page=%s", keyword, page_number)
                            break

                    total_jobs_found += iteration_jobs_found
                    log_iteration_summary(
                        logger,
                        "Indeed",
                        f"keyword='{keyword}' verification_skips={verification_skips}",
                        iteration_jobs_found,
                        iteration_fresh_jobs,
                        time.time() - iteration_start,
                    )

                random_pause(10.0, 60.0)
            except IndeedVerificationError as exc:
                logger.warning("Indeed driver restart requested: %s", exc)
                try:
                    driver.quit()
                except Exception:
                    pass
                random_pause(5.0, 10.0)
                driver = create_driver()
            except Exception:
                logger.exception("Indeed fatal cycle error. Recreating driver.")
                try:
                    driver.quit()
                except Exception:
                    pass
                random_pause(20.0, 60.0)
                driver = create_driver()
            finally:
                log_cycle_summary(
                    logger,
                    "Indeed",
                    total_jobs_found,
                    fresh_jobs,
                    time.time() - cycle_start,
                )
    except KeyboardInterrupt:
        logger.info("Indeed shutting down.")
        driver.quit()
