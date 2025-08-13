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

  Scenario: Get one user (not found)
    Given I have a valid access token
    When I GET "/users/does-not-exist"
    Then the response status should be 404
    And the response json should have "error" = "not_found"

  Scenario: Create user
    Given I have a valid access token
    When I POST json to "/users" with:
      """
      { "email": "new@user.com", "name": "New User" }
      """
    Then the response status should be 200
    And the response json should have a string at "id"
    And the response json should have "email" = "new@user.com"

  Scenario: Invalid token should be rejected (no need to start server)
    When I GET "/users" with bearer "nope"
    Then the response status should be 401
    And the response json should have "error" = "invalid_token"