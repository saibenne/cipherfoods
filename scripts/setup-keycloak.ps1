$ErrorActionPreference = 'Stop'
$KC = 'http://localhost:8180'
$headers = @{}

function Get-AdminToken {
    $body = @{ grant_type='password'; client_id='admin-cli'; username='admin'; password='admin' }
    $resp = Invoke-RestMethod -Uri "$KC/realms/master/protocol/openid-connect/token" -Method POST -Body $body
    $script:headers = @{ Authorization = "Bearer $($resp.access_token)"; 'Content-Type' = 'application/json' }
    Write-Host "[OK] Got admin token"
}

function Create-Realm {
    $realm = @{
        realm = 'cipherfoods'
        enabled = $true
        displayName = 'CipherFoods'
        registrationAllowed = $true
        loginWithEmailAllowed = $true
        duplicateEmailsAllowed = $false
        resetPasswordAllowed = $true
        editUsernameAllowed = $false
        sslRequired = 'none'
        accessTokenLifespan = 3600
    } | ConvertTo-Json

    try {
        Invoke-RestMethod -Uri "$KC/admin/realms" -Method POST -Headers $headers -Body $realm
        Write-Host "[OK] Created realm: cipherfoods"
    } catch {
        if ($_.Exception.Response.StatusCode -eq 409) {
            Write-Host "[SKIP] Realm cipherfoods already exists"
        } else { throw }
    }
}

function Create-Client {
    $client = @{
        clientId = 'api-gateway'
        name = 'API Gateway'
        enabled = $true
        publicClient = $false
        secret = 'cipherfoods-client-secret'
        directAccessGrantsEnabled = $true
        serviceAccountsEnabled = $true
        authorizationServicesEnabled = $false
        redirectUris = @('http://localhost:4200/*', 'http://localhost:3001/*', 'http://localhost:3002/*', 'http://localhost:3000/*')
        webOrigins = @('http://localhost:4200', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3000')
        protocol = 'openid-connect'
        standardFlowEnabled = $true
        implicitFlowEnabled = $false
    } | ConvertTo-Json

    try {
        Invoke-RestMethod -Uri "$KC/admin/realms/cipherfoods/clients" -Method POST -Headers $headers -Body $client
        Write-Host "[OK] Created client: api-gateway"
    } catch {
        if ($_.Exception.Response.StatusCode -eq 409) {
            Write-Host "[SKIP] Client api-gateway already exists"
        } else { throw }
    }
}

function Create-Roles {
    $roles = @('customer', 'vendor', 'admin')
    foreach ($role in $roles) {
        $body = @{ name = $role; description = "CipherFoods $role role" } | ConvertTo-Json
        try {
            Invoke-RestMethod -Uri "$KC/admin/realms/cipherfoods/roles" -Method POST -Headers $headers -Body $body
            Write-Host "[OK] Created role: $role"
        } catch {
            if ($_.Exception.Response.StatusCode -eq 409) {
                Write-Host "[SKIP] Role $role already exists"
            } else { throw }
        }
    }
}

function Create-User {
    param([string]$Username, [string]$Email, [string]$FirstName, [string]$LastName, [string]$Password, [string]$Role)

    $user = @{
        username = $Username
        email = $Email
        firstName = $FirstName
        lastName = $LastName
        enabled = $true
        emailVerified = $true
        credentials = @(@{
            type = 'password'
            value = $Password
            temporary = $false
        })
    } | ConvertTo-Json -Depth 3

    try {
        Invoke-RestMethod -Uri "$KC/admin/realms/cipherfoods/users" -Method POST -Headers $headers -Body $user
        Write-Host "[OK] Created user: $Username"
    } catch {
        if ($_.Exception.Response.StatusCode -eq 409) {
            Write-Host "[SKIP] User $Username already exists"
        } else { throw }
    }

    # Get user ID
    $users = Invoke-RestMethod -Uri "$KC/admin/realms/cipherfoods/users?username=$Username&exact=true" -Method GET -Headers $headers
    $userId = $users[0].id

    # Force-reset password to ensure it's correct (handles pre-existing users)
    $pwBody = @{ type = 'password'; value = $Password; temporary = $false } | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri "$KC/admin/realms/cipherfoods/users/$userId/reset-password" -Method PUT -Headers $headers -Body $pwBody
        Write-Host "[OK] Password set for $Username"
    } catch {
        Write-Host "[WARN] Password reset for $Username : $($_.Exception.Message)"
    }

    # Get role
    $roleObj = Invoke-RestMethod -Uri "$KC/admin/realms/cipherfoods/roles/$Role" -Method GET -Headers $headers

    # Assign role
    $roleMapping = @($roleObj) | ConvertTo-Json -Depth 3
    # Ensure it's an array
    if (-not $roleMapping.StartsWith('[')) { $roleMapping = "[$roleMapping]" }

    try {
        Invoke-RestMethod -Uri "$KC/admin/realms/cipherfoods/users/$userId/role-mappings/realm" -Method POST -Headers $headers -Body $roleMapping
        Write-Host "[OK] Assigned role '$Role' to $Username"
    } catch {
        Write-Host "[WARN] Role assignment for $Username : $($_.Exception.Message)"
    }
}

# === EXECUTE ===
Write-Host "=== CipherFoods Keycloak Setup ==="
Write-Host ""

Get-AdminToken
Create-Realm

# Re-acquire token (to refresh)
Get-AdminToken

Create-Client
Create-Roles

Write-Host ""
Write-Host "--- Creating Test Users ---"

Create-User -Username 'testadmin' -Email 'admin@cipherfoods.test' `
    -FirstName 'Admin' -LastName 'User' -Password 'Test@1234' -Role 'admin'

Create-User -Username 'testvendor' -Email 'vendor@cipherfoods.test' `
    -FirstName 'Vendor' -LastName 'User' -Password 'Test@1234' -Role 'vendor'

Create-User -Username 'testcustomer' -Email 'customer@cipherfoods.test' `
    -FirstName 'Customer' -LastName 'User' -Password 'Test@1234' -Role 'customer'

Write-Host ""
Write-Host "=== Setup Complete ==="
Write-Host ""
Write-Host "Keycloak Admin Console: http://localhost:8180/admin"
Write-Host "  Username: admin"
Write-Host "  Password: admin"
Write-Host ""
Write-Host "CipherFoods Realm: cipherfoods"
Write-Host "Client ID: api-gateway"
Write-Host "Client Secret: cipherfoods-client-secret"
Write-Host ""
Write-Host "Test Accounts (all passwords: Test@1234):"
Write-Host "  Admin:    testadmin    / Test@1234  (role: admin)"
Write-Host "  Vendor:   testvendor   / Test@1234  (role: vendor)"
Write-Host "  Customer: testcustomer / Test@1234  (role: customer)"
