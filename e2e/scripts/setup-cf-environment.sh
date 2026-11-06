#!/bin/bash
# =============================================================================
# CF Test Environment Setup Script
# =============================================================================
#
# This script helps set up a Cloud Foundry environment for Stratos E2E tests.
# It creates the necessary org, space, and users for testing.
#
# Prerequisites:
# - CF CLI installed (v8+)
# - Access to a Cloud Foundry deployment
# - Admin credentials for CF
#
# Usage:
#   ./setup-cf-environment.sh
#
# Or with parameters:
#   ./setup-cf-environment.sh <api-url> <admin-user> <admin-password>
#
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ORG_NAME="${CF_TEST_ORG:-e2e}"
SPACE_NAME="${CF_TEST_SPACE:-e2e}"
USER_NAME="${CF_TEST_USER:-cf-user}"
USER_PASSWORD="${CF_TEST_USER_PASSWORD:-changeme}"
REMOVE_USER="${CF_REMOVE_USER:-e2e-remove-user}"
REMOVE_PASSWORD="${CF_REMOVE_USER_PASSWORD:-changeme}"

# Functions
print_header() {
    echo -e "${BLUE}==============================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}==============================================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

check_cf_cli() {
    if ! command -v cf &> /dev/null; then
        print_error "CF CLI not found. Please install CF CLI v8+"
        echo "  macOS: brew install cloudfoundry/tap/cf-cli@8"
        echo "  Linux: https://docs.cloudfoundry.org/cf-cli/install-go-cli.html"
        exit 1
    fi

    CF_VERSION=$(cf version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    print_success "CF CLI found (version $CF_VERSION)"
}

cf_login() {
    print_header "Cloud Foundry Login"

    # Get credentials from parameters or prompt
    if [ -n "$1" ] && [ -n "$2" ] && [ -n "$3" ]; then
        API_URL="$1"
        ADMIN_USER="$2"
        ADMIN_PASSWORD="$3"
    else
        echo -n "CF API URL (e.g., https://api.cf.example.com): "
        read API_URL
        echo -n "CF Admin Username: "
        read ADMIN_USER
        echo -n "CF Admin Password: "
        read -s ADMIN_PASSWORD
        echo
    fi

    print_info "Logging in to $API_URL..."
    if cf login -a "$API_URL" -u "$ADMIN_USER" -p "$ADMIN_PASSWORD" --skip-ssl-validation; then
        print_success "Logged in successfully"
    else
        print_error "Failed to login to Cloud Foundry"
        exit 1
    fi
}

create_org() {
    print_header "Creating Test Organization"

    if cf org "$ORG_NAME" &> /dev/null; then
        print_info "Organization '$ORG_NAME' already exists"
    else
        print_info "Creating organization '$ORG_NAME'..."
        cf create-org "$ORG_NAME"
        print_success "Organization created"
    fi

    # Get org GUID
    ORG_GUID=$(cf org "$ORG_NAME" --guid)
    print_success "Organization GUID: $ORG_GUID"
    echo "$ORG_GUID" > /tmp/cf-test-org-guid.txt
}

create_space() {
    print_header "Creating Test Space"

    if cf space "$SPACE_NAME" -o "$ORG_NAME" &> /dev/null; then
        print_info "Space '$SPACE_NAME' already exists in org '$ORG_NAME'"
    else
        print_info "Creating space '$SPACE_NAME' in org '$ORG_NAME'..."
        cf create-space "$SPACE_NAME" -o "$ORG_NAME"
        print_success "Space created"
    fi

    # Target the space
    cf target -o "$ORG_NAME" -s "$SPACE_NAME"

    # Get space GUID
    SPACE_GUID=$(cf space "$SPACE_NAME" --guid)
    print_success "Space GUID: $SPACE_GUID"
    echo "$SPACE_GUID" > /tmp/cf-test-space-guid.txt
}

create_test_user() {
    print_header "Creating Test Users"

    # Create regular test user
    print_info "Creating user '$USER_NAME'..."
    if cf create-user "$USER_NAME" "$USER_PASSWORD" &> /dev/null; then
        print_success "User '$USER_NAME' created"
    else
        print_info "User '$USER_NAME' may already exist (continuing...)"
    fi

    # Assign roles
    print_info "Assigning roles to '$USER_NAME'..."
    cf set-org-role "$USER_NAME" "$ORG_NAME" OrgUser
    cf set-space-role "$USER_NAME" "$ORG_NAME" "$SPACE_NAME" SpaceDeveloper
    print_success "Roles assigned to '$USER_NAME'"

    # Create removal test user (optional)
    print_info "Creating removal test user '$REMOVE_USER'..."
    if cf create-user "$REMOVE_USER" "$REMOVE_PASSWORD" &> /dev/null; then
        print_success "User '$REMOVE_USER' created"
        cf set-org-role "$REMOVE_USER" "$ORG_NAME" OrgUser
        cf set-space-role "$REMOVE_USER" "$ORG_NAME" "$SPACE_NAME" SpaceDeveloper
        print_success "Roles assigned to '$REMOVE_USER'"
    else
        print_info "User '$REMOVE_USER' may already exist"
    fi
}

verify_domains() {
    print_header "Verifying Domains"

    print_info "Available domains:"
    cf domains

    DOMAIN_COUNT=$(cf domains | grep -c "shared" || true)
    if [ "$DOMAIN_COUNT" -gt 0 ]; then
        print_success "Found $DOMAIN_COUNT shared domain(s) for route creation"
    else
        print_error "No shared domains found - you may need to create one for route tests"
        echo "  Example: cf create-shared-domain test.example.com"
    fi
}

check_services() {
    print_header "Checking Service Marketplace"

    print_info "Available services:"
    cf marketplace

    SERVICE_COUNT=$(cf marketplace | grep -c "^[a-z]" || true)
    if [ "$SERVICE_COUNT" -gt 0 ]; then
        print_success "Found $SERVICE_COUNT service(s) available"
        print_info "You can configure service tests in secrets.yaml"
    else
        print_info "No services found - marketplace tests will be skipped"
    fi
}

generate_secrets_template() {
    print_header "Generating secrets.yaml Template"

    ORG_GUID=$(cat /tmp/cf-test-org-guid.txt)
    SPACE_GUID=$(cat /tmp/cf-test-space-guid.txt)

    # Check if secrets.yaml already exists
    if [ -f "../../secrets.yaml" ]; then
        print_info "secrets.yaml already exists - creating secrets.yaml.generated instead"
        SECRETS_FILE="../../secrets.yaml.generated"
    else
        SECRETS_FILE="../../secrets.yaml"
    fi

    cat > "$SECRETS_FILE" << EOF
# Generated by setup-cf-environment.sh on $(date)
consoleUsers:
  admin:
    username: admin
    password: changeme  # Set your Stratos admin password
  nonAdmin:
    username: user
    password: changeme  # Set your Stratos user password

endpoints:
  cf:
  - name: cf
    url: ${API_URL}
    skipSSLValidation: true
    testOrg: ${ORG_NAME}
    testOrgGuid: ${ORG_GUID}
    testSpace: ${SPACE_NAME}
    testSpaceGuid: ${SPACE_GUID}
    creds:
      admin:
        username: ${ADMIN_USER}
        password: ${ADMIN_PASSWORD}
      nonAdmin:
        username: ${USER_NAME}
        password: ${USER_PASSWORD}
      removeUser:
        username: ${REMOVE_USER}
        password: ${REMOVE_PASSWORD}

skipSSLValidation: true
headless: false
EOF

    print_success "Secrets file created: $SECRETS_FILE"
    echo
    print_info "IMPORTANT: Update the following in $SECRETS_FILE:"
    echo "  - Stratos admin/user passwords (consoleUsers section)"
    echo "  - CF admin password if you want to change it"
    echo "  - Add service configuration for marketplace tests (optional)"
    echo "  - Add UAA configuration for user invitation tests (optional)"
}

print_summary() {
    print_header "Setup Summary"

    ORG_GUID=$(cat /tmp/cf-test-org-guid.txt)
    SPACE_GUID=$(cat /tmp/cf-test-space-guid.txt)

    echo -e "${GREEN}✓ Cloud Foundry test environment is ready!${NC}"
    echo
    echo "Configuration:"
    echo "  API URL:      $API_URL"
    echo "  Organization: $ORG_NAME (GUID: $ORG_GUID)"
    echo "  Space:        $SPACE_NAME (GUID: $SPACE_GUID)"
    echo "  Test User:    $USER_NAME"
    echo "  Remove User:  $REMOVE_USER"
    echo
    echo "Next Steps:"
    echo "  1. cd ../../  # Go to project root"
    echo "  2. Edit secrets.yaml with your Stratos credentials"
    echo "  3. bun install  # Install dependencies"
    echo "  4. bun run start  # Start Stratos"
    echo "  5. bunx playwright test e2e/tests/  # Run tests"
    echo
    echo "Verification:"
    echo "  cf target -o $ORG_NAME -s $SPACE_NAME"
    echo "  cf apps"
    echo "  cf services"
    echo
    print_success "Setup complete!"

    # Cleanup temp files
    rm -f /tmp/cf-test-org-guid.txt /tmp/cf-test-space-guid.txt
}

# Main execution
main() {
    print_header "CF Test Environment Setup for Stratos E2E Tests"

    check_cf_cli
    cf_login "$@"
    create_org
    create_space
    create_test_user
    verify_domains
    check_services
    generate_secrets_template
    print_summary
}

# Run main function
main "$@"
