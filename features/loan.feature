@ui
Feature: Loan planning and repayment report
  A borrower can calculate payments and inspect the annual repayment schedule.

  Scenario: Dashboard loads with a default loan
    Given I open the loan dashboard
    Then the dashboard shows the default loan summary
    And there are no browser errors

  Scenario Outline: Payments match an independent amortization calculation
    Given I open the loan dashboard
    When I calculate a loan of <amount> INR at <rate> percent for <years> years
    Then the displayed payment and totals match the independent calculation
    When I open the repayment report
    Then the annual chart and schedule contain valid data
    And there are no browser errors

    Examples:
      | amount  | rate | years |
      | 2500000 | 10   | 10    |
      | 5000000 | 7.5  | 15    |
      | 1000000 | 12   | 5     |
      | 120000  | 0    | 1     |
      | 1       | 0    | 1     |
      | 120000  | 0.000001 | 1 |
      | 100000000 | 40 | 40    |

  Scenario: Navigation preserves a recalculated loan
    Given I open the loan dashboard
    When I calculate a loan of 750000 INR at 8 percent for 3 years
    And I open the repayment report
    And I return to the dashboard
    Then the displayed payment and totals match the independent calculation

  Scenario: A report can be opened directly
    Given I open the repayment report directly
    Then the report heading and default schedule are visible

  Scenario Outline: Invalid loan input leaves the last valid summary unchanged
    Given I open the loan dashboard
    When I submit "<amount>" INR at "<rate>" percent for "<years>" years
    Then I see the validation message "<message>"
    And the default summary has not changed

    Examples:
      | amount    | rate | years | message                                                    |
      | -1        | 10   | 10    | Enter a whole loan amount between 1 and 100,000,000 INR.     |
      | 100000001 | 10   | 10    | Enter a whole loan amount between 1 and 100,000,000 INR.     |
      |           | 10   | 10    | Enter a whole loan amount between 1 and 100,000,000 INR.     |
      | 2500000   | 41   | 10    | Enter an annual interest rate between 0 and 40%.            |
      | 2500000   | -1   | 10    | Enter an annual interest rate between 0 and 40%.            |
      | 2500000   | 10   | 0     | Enter a whole loan tenure between 1 and 40 years.           |
      | 2500000   | 10   | 2.5   | Enter a whole loan tenure between 1 and 40 years.           |

  Scenario: Chart remains usable on a narrow screen
    Given I open the loan dashboard on a mobile viewport
    When I calculate a loan of 1000000 INR at 12 percent for 5 years
    And I open the repayment report
    Then the annual chart and schedule contain valid data
    And the page fits the viewport
