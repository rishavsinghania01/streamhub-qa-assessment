# JSONPlaceholder validation finding

Target: `POST /posts` at the configured `JSONPLACEHOLDER_BASE_URL`.

| Input | Requested expectation | Observed result |
| --- | --- | --- |
| Title of 10,000 ASCII characters | Validation error | 201, title echoed, numeric id assigned |
| Unicode, escaped control characters and markup in title | Validation error | 201, title echoed, numeric id assigned |
| Missing `userId` | Validation error | 201, omitted field stayed absent, numeric id assigned |

All requests reached the public service through Playwright's APIRequestContext. The records in `reports/api/` include the payload, timestamp, response headers and body. The contract failures are retained in `reports/api.html` and `reports/assessment.html`. The separate observed suite checks 201, a numeric id and exact payload echoing; those passing results do not satisfy the rejection requirement.

JSONPlaceholder describes itself as a fake API, and its guide says writes are simulated. Its documentation does not specify a title size limit or forbidden character set. A real post-creation API should define those rules before the test chooses a boundary or calls characters unsupported. Valid JSON strings can contain Unicode and escaped control characters. Echoed script text in a JSON response is not by itself evidence of browser script execution.

For a production service, agree the field schema, size limits and allowed content first. Then test values just below, at and above each limit, missing/wrong-type fields, consistent 4xx error shapes, and whether rejected requests left any persisted state. That persistence check is not meaningful against this fake service's simulated writes.

Source: [JSONPlaceholder documentation](https://jsonplaceholder.typicode.com/).
