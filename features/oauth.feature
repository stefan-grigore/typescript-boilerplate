Feature: OAuth token endpoint (client credentials)

  Scenario: Successful token issuance
    When I POST form to "/oauth/tokens" with:
      | grant_type    | client_credentials |
      | client_id     | my-client          |
      | client_secret | supersecret        |
      | scope         | read:users         |
    Then the response status should be 200
    And the response json should have "token_type" = "Bearer"
    And save "access_token" as the bearer token

  Scenario: Invalid client
    When I POST form to "/oauth/tokens" with:
      | grant_type    | client_credentials |
      | client_id     | wrong              |
      | client_secret | nope               |
    Then the response status should be 401
    And the response json should have "error" = "invalid_client"

  Scenario: Unsupported grant
    When I POST form to "/oauth/tokens" with:
      | grant_type | password |
    Then the response status should be 400
    And the response json should have "error" = "unsupported_grant_type"

  Scenario: Missing client credentials
    When I POST form to "/oauth/tokens" with:
        | grant_type | client_credentials |
    Then the response status should be 400
    And the response json should have "error" = "invalid_request"

  Scenario: Access with an expired token is rejected
    When I obtain an access token
    And I fast-forward token storage by 999999 seconds
    And I GET "/users" with saved bearer
    Then the response status should be 401
    And the response json should have "error" = "invalid_token"

  Scenario: Token with mismatched JTI is rejected
    When I obtain an access token
    And I corrupt the stored JTI for the saved bearer
    And I GET "/users" with saved bearer
    Then the response status should be 401
    And the response json should have "error" = "invalid_token"