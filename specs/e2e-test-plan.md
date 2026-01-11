# ECHONET Lite Lookup E2E Test Plan

## Application Overview

This test plan covers end-to-end testing for the ECHONET Lite Lookup web application, a manufacturer code search tool. The application provides search functionality for ECHONET Lite manufacturer codes (3-byte hexadecimal codes) and company names. It features a single-page application (SPA) architecture built with TanStack Router, consisting of an index page (/) with a search interface and a search results page (/search).

## Test Scenarios

### 1. Page Navigation and Initial Load

**Seed:** ``

#### 1.1. Index page loads successfully

**File:** `tests/page-navigation/index-page-load.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/
  2. Verify the page title contains 'ECHONET Lite'
  3. Verify the heading 'ECHONET Liteメーカーコード検索' is displayed
  4. Verify the description text 'ECHONET Liteで使用されるメーカーコードを検索できます' is present
  5. Verify the search form is visible

**Expected Results:**
  - Page loads without errors
  - All UI elements render correctly
  - Search form is interactive and ready for input

#### 1.2. Search form elements are present and functional

**File:** `tests/page-navigation/search-form-elements.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/
  2. Verify search input field is present with placeholder 'メーカー名またはコードを入力'
  3. Verify search type dropdown is present
  4. Verify dropdown has option '企業名' selected by default
  5. Verify dropdown has option 'メーカーコード'
  6. Verify search button is present with text '検索'
  7. Verify all form elements are enabled

**Expected Results:**
  - Search input accepts text input
  - Dropdown allows selection change
  - Search button is clickable
  - Form elements have correct default values

#### 1.3. Direct navigation to search page without parameters

**File:** `tests/page-navigation/search-page-no-params.spec.ts`

**Steps:**
  1. Navigate directly to http://localhost:3000/search
  2. Verify the search form is displayed
  3. Verify search results section is visible
  4. Check if all manufacturers are displayed (empty query shows all results)

**Expected Results:**
  - Page loads successfully
  - Search form is functional
  - All manufacturer records are displayed by default
  - Result count message shows total number of manufacturers

### 2. Search by Company Name

**Seed:** ``

#### 2.1. Partial match search by Japanese company name

**File:** `tests/search-by-name/partial-match-japanese.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/
  2. Verify search type dropdown is set to '企業名'
  3. Enter '東芝' in the search input field
  4. Click the '検索' button
  5. Wait for navigation to /search page
  6. Verify URL contains query parameters 'q=東芝' and 'type=name'

**Expected Results:**
  - Search redirects to /search page with correct parameters
  - Results table displays manufacturers containing '東芝' in their name
  - Result count message shows correct number (e.g., 'X件のメーカーが見つかりました')
  - Each result row shows manufacturer code in format '0xXXXXXX'
  - Each result row shows company name in Japanese
  - Search is case-insensitive

#### 2.2. Exact match search by company name

**File:** `tests/search-by-name/exact-match.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/
  2. Ensure search type is set to '企業名'
  3. Enter an exact company name (e.g., 'パナソニック株式会社') in the search input
  4. Click the '検索' button
  5. Wait for results to load

**Expected Results:**
  - Search returns at least one result matching the exact name
  - Result table displays the matched manufacturer
  - Manufacturer code is displayed in correct format
  - Company name matches the search query

#### 2.3. Search with English company name

**File:** `tests/search-by-name/english-name-search.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/
  2. Set search type to '企業名'
  3. Enter an English company name (e.g., 'Panasonic') in the search input
  4. Click the '検索' button
  5. Verify results are displayed

**Expected Results:**
  - Search successfully matches English names
  - Results include manufacturers with matching English names
  - Both Japanese name and English name are displayed in results
  - English name appears in parentheses after Japanese name

#### 2.4. Case-insensitive company name search

**File:** `tests/search-by-name/case-insensitive.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/
  2. Set search type to '企業名'
  3. Enter 'panasonic' (lowercase) in the search input
  4. Click the '検索' button
  5. Note the number of results
  6. Navigate back to home page
  7. Enter 'PANASONIC' (uppercase) in the search input
  8. Click the '検索' button
  9. Compare the results

**Expected Results:**
  - Both searches return identical results
  - Search is case-insensitive
  - Same manufacturer records appear in both result sets

#### 2.5. Partial string match in company name

**File:** `tests/search-by-name/partial-string-match.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/
  2. Set search type to '企業名'
  3. Enter a partial word (e.g., 'ソニ') in the search input
  4. Click the '検索' button
  5. Verify results contain companies with the partial match

**Expected Results:**
  - Search returns all manufacturers containing the partial string
  - Results include companies like 'ソニー株式会社', 'パナソニック', etc.
  - Partial match works anywhere in the company name

### 3. Search by Manufacturer Code

**Seed:** ``

#### 3.1. Search by complete hexadecimal code with 0x prefix

**File:** `tests/search-by-code/hex-with-prefix.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/
  2. Change search type dropdown to 'メーカーコード'
  3. Enter '0x000002' in the search input field
  4. Click the '検索' button
  5. Wait for results to load
  6. Verify URL contains 'type=code'

**Expected Results:**
  - Search finds manufacturer with code '000002'
  - Result displays with formatted code '0x000002'
  - Company name is displayed correctly
  - Search handles '0x' prefix correctly

#### 3.2. Search by hexadecimal code without 0x prefix

**File:** `tests/search-by-code/hex-without-prefix.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/
  2. Set search type to 'メーカーコード'
  3. Enter '000002' (without 0x prefix) in the search input
  4. Click the '検索' button
  5. Verify results are displayed

**Expected Results:**
  - Search successfully finds the manufacturer
  - Results are identical to search with '0x' prefix
  - Code is displayed in standard format '0x000002'

#### 3.3. Partial code match search

**File:** `tests/search-by-code/partial-code-match.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/
  2. Set search type to 'メーカーコード'
  3. Enter '0000' (partial code) in the search input
  4. Click the '検索' button
  5. Review the results

**Expected Results:**
  - Search returns all manufacturer codes containing '0000'
  - Multiple results are displayed (e.g., 0x000001, 0x000002, etc.)
  - Result count reflects total number of matches
  - All matching codes are highlighted or visible in results

#### 3.4. Case-insensitive code search

**File:** `tests/search-by-code/case-insensitive-code.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/
  2. Set search type to 'メーカーコード'
  3. Enter '0x00000a' (lowercase hex) in the search input
  4. Click the '検索' button
  5. Note the results
  6. Navigate back to home
  7. Enter '0x00000A' (uppercase hex) in the search input
  8. Click the '検索' button
  9. Compare results

**Expected Results:**
  - Both searches return identical results
  - Hexadecimal search is case-insensitive
  - Code display format remains consistent (uppercase)

#### 3.5. Search with uppercase 0X prefix

**File:** `tests/search-by-code/uppercase-prefix.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/
  2. Set search type to 'メーカーコード'
  3. Enter '0X000002' (uppercase 0X) in the search input
  4. Click the '検索' button
  5. Verify search executes correctly

**Expected Results:**
  - Search handles uppercase '0X' prefix correctly
  - Results are identical to lowercase '0x' prefix search
  - Manufacturer with matching code is displayed

### 4. Empty Search Results and No Matches

**Seed:** ``

#### 4.1. Search with non-existent company name

**File:** `tests/empty-results/nonexistent-company.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/
  2. Set search type to '企業名'
  3. Enter 'XYZ不存在企業名123' in the search input
  4. Click the '検索' button
  5. Wait for results page to load

**Expected Results:**
  - Page displays message '該当するメーカーが見つかりませんでした'
  - No results table is displayed
  - No result count message is shown
  - Search form remains functional for retry

#### 4.2. Search with non-existent manufacturer code

**File:** `tests/empty-results/nonexistent-code.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/
  2. Set search type to 'メーカーコード'
  3. Enter '0xFFFFFF' (likely non-existent code) in the search input
  4. Click the '検索' button
  5. Verify the no results message

**Expected Results:**
  - Message '該当するメーカーが見つかりませんでした' is displayed
  - No manufacturer records are shown
  - User can perform a new search without page reload

#### 4.3. Empty query shows all manufacturers

**File:** `tests/empty-results/empty-query-all-results.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/
  2. Leave search input field empty (no text)
  3. Click the '検索' button
  4. Wait for results to load

**Expected Results:**
  - All manufacturer records are displayed
  - Result count shows total number of manufacturers in database
  - Results table contains all available data
  - Empty query is treated as 'show all' functionality

#### 4.4. Whitespace-only query shows all manufacturers

**File:** `tests/empty-results/whitespace-query.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/
  2. Enter only whitespace characters (spaces/tabs) in the search input
  3. Click the '検索' button
  4. Verify results

**Expected Results:**
  - Whitespace is trimmed and treated as empty query
  - All manufacturers are displayed
  - Behavior is identical to empty query search

### 5. Form Validation and User Interactions

**Seed:** ``

#### 5.1. Search type dropdown changes correctly

**File:** `tests/form-interaction/dropdown-change.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/
  2. Verify '企業名' is selected in the dropdown by default
  3. Click on the search type dropdown
  4. Select 'メーカーコード' option
  5. Verify the selected value changes
  6. Enter a test query and submit
  7. Verify URL contains 'type=code'

**Expected Results:**
  - Dropdown value changes visually
  - Selected option persists until changed
  - Search behavior changes based on selected type
  - URL parameter reflects the selected search type

#### 5.2. Form submission via Enter key

**File:** `tests/form-interaction/enter-key-submit.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/
  2. Click in the search input field to focus
  3. Type a search query (e.g., 'パナソニック')
  4. Press the Enter key
  5. Verify form submits without clicking the button

**Expected Results:**
  - Form submits when Enter key is pressed
  - Navigation to search page occurs
  - Search results are displayed
  - Behavior is identical to clicking the search button

#### 5.3. Search input retains value after navigation

**File:** `tests/form-interaction/input-value-persistence.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/
  2. Enter '東芝' in the search input
  3. Click the '検索' button
  4. Wait for results page to load
  5. Verify the search input still displays '東芝' on the results page

**Expected Results:**
  - Search input value persists across navigation
  - User can see what they searched for
  - Input field is ready for modification and re-search
  - Search type selection also persists

#### 5.4. Multiple consecutive searches

**File:** `tests/form-interaction/consecutive-searches.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/
  2. Enter 'パナソニック' and submit search
  3. Wait for results
  4. Clear the search input
  5. Enter '東芝' and submit search
  6. Wait for new results
  7. Verify results update correctly

**Expected Results:**
  - Each search returns appropriate results
  - Previous search results are replaced
  - No duplicate results appear
  - URL updates with each search
  - Application state remains consistent

#### 5.5. Changing search type between searches

**File:** `tests/form-interaction/search-type-change-between-searches.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/
  2. Search for 'パナソニック' by '企業名'
  3. Verify results are displayed
  4. Change dropdown to 'メーカーコード'
  5. Search for '000002'
  6. Verify new search uses code search logic
  7. Verify URL parameter changes to 'type=code'

**Expected Results:**
  - Search type change affects search behavior
  - Results reflect the correct search type
  - No interference between different search types
  - URL accurately represents current search state

#### 5.6. Back button navigation after search

**File:** `tests/form-interaction/back-button-navigation.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/
  2. Perform a search (e.g., search for 'パナソニック')
  3. Wait for results to load on /search page
  4. Click the browser back button
  5. Verify navigation returns to index page

**Expected Results:**
  - Browser back button works correctly
  - User returns to index page
  - Search form is reset or retains previous state
  - No JavaScript errors occur
  - Application remains functional after navigation

#### 5.7. Direct URL access with search parameters

**File:** `tests/form-interaction/direct-url-with-params.spec.ts`

**Steps:**
  1. Navigate directly to http://localhost:3000/search?q=パナソニック&type=name
  2. Verify page loads correctly
  3. Verify search input displays 'パナソニック'
  4. Verify search type dropdown shows '企業名'
  5. Verify search results match the query

**Expected Results:**
  - Deep linking works correctly
  - Search executes automatically based on URL parameters
  - Form state reflects URL parameters
  - Results are displayed without additional user action

### 6. Results Display and Formatting

**Seed:** ``

#### 6.1. Results table structure and content

**File:** `tests/results-display/table-structure.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/
  2. Perform a search that returns multiple results (e.g., search '0000')
  3. Wait for results table to appear
  4. Verify table has a header row
  5. Verify table headers are 'メーカーコード' and '企業名'
  6. Verify table body contains result rows
  7. Count the number of result rows

**Expected Results:**
  - Table has proper HTML structure with thead and tbody
  - Headers are clearly labeled
  - Each result row has two columns (code and name)
  - Number of rows matches the result count message
  - Table is readable and properly formatted

#### 6.2. Manufacturer code formatting in results

**File:** `tests/results-display/code-formatting.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/
  2. Search for a specific manufacturer by name
  3. Inspect the manufacturer code column in results
  4. Verify code format starts with '0x'
  5. Verify code is displayed in uppercase hexadecimal
  6. Verify code has proper zero-padding (6 hex digits)

**Expected Results:**
  - All codes display in format '0xXXXXXX'
  - Codes are uppercase (e.g., '0x000002' not '0x000002')
  - Consistent formatting across all results
  - Codes are easily readable and copyable

#### 6.3. Company name display with English translation

**File:** `tests/results-display/company-name-with-english.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/
  2. Search for manufacturers that have English names
  3. Verify Japanese name is displayed
  4. Verify English name appears in parentheses
  5. Check formatting of the name display

**Expected Results:**
  - Japanese name is displayed first
  - English name follows in parentheses if available
  - Format: '日本語名 (English Name)'
  - Names without English translation show only Japanese
  - Text is properly aligned and readable

#### 6.4. Result count message accuracy

**File:** `tests/results-display/result-count-accuracy.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/
  2. Perform searches with different expected result counts
  3. Search 1: Empty query (should show all manufacturers)
  4. Note the count message (e.g., 'X件のメーカーが見つかりました')
  5. Count actual table rows
  6. Search 2: Query with few results (e.g., specific company name)
  7. Verify count message matches table row count

**Expected Results:**
  - Count message accurately reflects number of results
  - Message format: '[N]件のメーカーが見つかりました'
  - Count matches actual number of table rows
  - Count updates correctly with each search

#### 6.5. Single result display

**File:** `tests/results-display/single-result.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/
  2. Perform a search that returns exactly one result
  3. Verify result count message shows '1件のメーカーが見つかりました'
  4. Verify table contains exactly one data row
  5. Verify the result displays complete information

**Expected Results:**
  - Single result is displayed correctly
  - Count message uses correct grammar for singular
  - Table layout works with single entry
  - All data fields are properly populated

#### 6.6. Large result set display

**File:** `tests/results-display/large-result-set.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/search (direct, no query)
  2. Verify all manufacturers are displayed
  3. Scroll through the results table
  4. Verify table remains readable with many rows
  5. Check for any UI rendering issues

**Expected Results:**
  - Large result sets display without performance issues
  - Table scrolling works smoothly
  - All rows are properly formatted
  - No layout breaking or text overflow
  - Page remains responsive

### 7. Edge Cases and Error Handling

**Seed:** ``

#### 7.1. Special characters in search query

**File:** `tests/edge-cases/special-characters.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/
  2. Enter special characters in search input (e.g., '株式会社', '・', '（）')
  3. Submit the search
  4. Verify search completes without errors

**Expected Results:**
  - Special characters are handled correctly
  - Search executes without JavaScript errors
  - Results include companies with matching special characters
  - URL encoding handles special characters properly

#### 7.2. Very long search query

**File:** `tests/edge-cases/long-search-query.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/
  2. Enter a very long string (e.g., 200+ characters) in search input
  3. Submit the search
  4. Verify application handles the query gracefully

**Expected Results:**
  - Application does not crash or error
  - Search completes (likely returning no results)
  - Input field handles long text appropriately
  - URL can accommodate long query strings or handles gracefully

#### 7.3. Repeated rapid searches

**File:** `tests/edge-cases/rapid-repeated-searches.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/
  2. Quickly perform multiple searches in succession
  3. Submit search for 'パナソニック'
  4. Immediately submit search for '東芝'
  5. Immediately submit search for 'ソニー'
  6. Verify final results are correct

**Expected Results:**
  - Application handles rapid searches correctly
  - Final displayed results match the last search query
  - No race conditions or stale data displayed
  - Navigation state is consistent

#### 7.4. Search with HTML/script tags in input

**File:** `tests/edge-cases/html-script-injection.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/
  2. Enter '<script>alert("test")</script>' in search input
  3. Submit the search
  4. Verify no alert or script execution occurs
  5. Check that input is treated as plain text

**Expected Results:**
  - Input is properly sanitized or escaped
  - No script execution occurs
  - Input is treated as literal search text
  - Search returns no results (as expected)
  - No security vulnerabilities exposed

#### 7.5. Invalid URL parameters

**File:** `tests/edge-cases/invalid-url-parameters.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/search?q=test&type=invalid
  2. Verify application handles invalid 'type' parameter
  3. Navigate to http://localhost:3000/search?invalid=param
  4. Verify application handles unexpected parameters gracefully

**Expected Results:**
  - Application defaults to safe values for invalid parameters
  - No JavaScript errors occur
  - Search functionality remains operational
  - Invalid type defaults to 'name' search

#### 7.6. Browser refresh on search results page

**File:** `tests/edge-cases/refresh-on-results-page.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/
  2. Perform a search for 'パナソニック'
  3. Wait for results to load
  4. Refresh the browser page (F5 or Ctrl+R)
  5. Verify results are re-displayed correctly

**Expected Results:**
  - Page reloads successfully
  - Search query is preserved from URL
  - Results are re-fetched and displayed
  - Application state is correctly restored
  - No loss of functionality after refresh

#### 7.7. Mixed case and unicode in search

**File:** `tests/edge-cases/mixed-case-unicode.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/
  2. Enter mixed case and unicode characters (e.g., 'パNaSoNic')
  3. Submit the search
  4. Verify search handles mixed character sets

**Expected Results:**
  - Search processes mixed case correctly
  - Unicode characters are handled properly
  - Search is case-insensitive across character sets
  - Results include matching entries regardless of case
