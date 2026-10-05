Feature: Locator healing review
  Broken locators are kept separate from the normal UI suite.

  @broken
  Scenario Outline: A legacy locator fails visibly
    Given I open the loan dashboard
    Then the legacy locator "<locator>" should find its intended element

    Examples:
      | locator       |
      | loan-amount   |
      | calculate     |
      | summary       |
      | report-link   |

  @healing
  Scenario Outline: A proposed replacement is validated in isolation
    Given I open the loan dashboard
    When I inspect the proposal for "<locator>"
    Then the proposal is unique and preserves its element contract
    And the calculation and navigation still work

    Examples:
      | locator       |
      | loan-amount   |
      | calculate     |
      | summary       |
      | report-link   |

  @healing
  Scenario: A plausible but incorrect replacement is rejected
    Given I open the loan dashboard
    Then a loan amount proposal pointing at the interest rate is rejected
