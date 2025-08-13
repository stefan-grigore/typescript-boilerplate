Feature: Users API

  Scenario: Must be authorized to list users
    When I GET "/users" without auth
    Then the response status should be 401
    And the response json should have "error" = "invalid_request"

  Scenario: List users with bearer token
    Given I have a valid access token
    When I GET "/users"
    Then the response status should be 200
    And the response json should be an array

  Scenario: Get a user that doesn't exist
    Given I have a valid access token
    When I GET "/users/does-not-exist"
    Then the response status should be 404
    And the response json should have "error" = "not_found"

  Scenario: Get a user that exists
    Given I have a valid access token
    When I POST json to "/users" with:
      """
      { "email": "exists@user.com", "name": "Exists User" }
      """
    Then the response status should be 200
    And I remember the user id
    When I GET that user
    Then the response status should be 200
    And the response json should have "email" = "exists@user.com"

  Scenario: Create user
    Given I have a valid access token
    When I POST json to "/users" with:
      """
      { "email": "new@user.com", "name": "New User" }
      """
    Then the response status should be 200
    And the response json should have a string at "id"
    And the response json should have "email" = "new@user.com"

  Scenario: Invalid token should be rejected
    When I GET "/users" with bearer "nope"
    Then the response status should be 401
    And the response json should have "error" = "invalid_token"

  Scenario: Internal error surfaces as server_error
    Given I have a valid access token
    When I GET "/users" while the service crashes
    Then the response status should be 500
    And the response json should have "error" = "server_error"