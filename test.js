import "dotenv/config";

const url = process.env.SMOKE_TEST_URL || process.env.PRODUCT_SERVICE_URL;

if (!url) {
  console.error("Set SMOKE_TEST_URL or PRODUCT_SERVICE_URL before running test.js");
  process.exit(1);
}

const res = await fetch(url);
console.log(res.status, await res.text());
