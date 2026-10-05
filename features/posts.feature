@api
Feature: JSONPlaceholder post validation
  The assessment expects invalid posts to be rejected without server errors.

  @contract
  Scenario Outline: Invalid post receives a client validation error
    Given an invalid post with "<case>"
    When I create the post
    Then the API does not have a server failure
    And the API rejects the post with a validation error

    Examples:
      | case               |
      | long title         |
      | special characters |
      | missing userId     |

  @observed
  Scenario Outline: Characterize the fake API response separately
    Given an invalid post with "<case>"
    When I create the post
    Then the API does not have a server failure
    And the fake API echoes the payload with a created id

    Examples:
      | case               |
      | long title         |
      | special characters |
      | missing userId     |
