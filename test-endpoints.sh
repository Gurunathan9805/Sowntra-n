#!/bin/bash

# Sowntra Backend API Testing Script
# Usage: ./test-endpoints.sh YOUR_FIREBASE_TOKEN

TOKEN="${1}"
BASE_URL="http://localhost:3001"

if [ -z "$TOKEN" ]; then
    echo "⚠️  No token provided. Testing public endpoints only..."
    echo ""
fi

echo "═══════════════════════════════════════════"
echo "  SOWNTRA BACKEND API TESTING"
echo "═══════════════════════════════════════════"
echo ""

# Test 1: Root endpoint
echo "1️⃣  Testing ROOT endpoint..."
curl -s "$BASE_URL/" | jq '.'
echo -e "\n"

# Test 2: Health check
echo "2️⃣  Testing HEALTH endpoint..."
curl -s "$BASE_URL/api/health" | jq '.'
echo -e "\n"

if [ -z "$TOKEN" ]; then
    echo "❌ No token provided. Skipping protected endpoints."
    echo "Usage: ./test-endpoints.sh YOUR_FIREBASE_TOKEN"
    exit 0
fi

# Test 3: User profile
echo "3️⃣  Testing USER PROFILE endpoint..."
curl -s -H "Authorization: Bearer $TOKEN" \
     "$BASE_URL/api/users/me" | jq '.'
echo -e "\n"

# Test 4: User stats
echo "4️⃣  Testing USER STATS endpoint..."
curl -s -H "Authorization: Bearer $TOKEN" \
     "$BASE_URL/api/users/me/stats" | jq '.'
echo -e "\n"

# Test 5: List boards
echo "5️⃣  Testing LIST BOARDS endpoint..."
curl -s -H "Authorization: Bearer $TOKEN" \
     "$BASE_URL/api/boards" | jq '.'
echo -e "\n"

# Test 6: Create board
echo "6️⃣  Testing CREATE BOARD endpoint..."
BOARD_RESPONSE=$(curl -s -X POST \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"title":"Test Board from Script","description":"Automated test","isPublic":false}' \
     "$BASE_URL/api/boards")
echo "$BOARD_RESPONSE" | jq '.'
BOARD_ID=$(echo "$BOARD_RESPONSE" | jq -r '.id')
echo "Created Board ID: $BOARD_ID"
echo -e "\n"

if [ "$BOARD_ID" != "null" ] && [ -n "$BOARD_ID" ]; then
    # Test 7: Get board
    echo "7️⃣  Testing GET BOARD endpoint..."
    curl -s -H "Authorization: Bearer $TOKEN" \
         "$BASE_URL/api/boards/$BOARD_ID" | jq '.'
    echo -e "\n"

    # Test 8: Save project data
    echo "8️⃣  Testing SAVE PROJECT DATA endpoint..."
    curl -s -X POST \
         -H "Authorization: Bearer $TOKEN" \
         -H "Content-Type: application/json" \
         -d '{"projectData":{"elements":[{"id":"elem1","type":"text","x":100,"y":100}],"pages":[{"id":"page1","name":"Page 1"}]}}' \
         "$BASE_URL/api/projects/$BOARD_ID/save" | jq '.'
    echo -e "\n"

    # Test 9: Load project data
    echo "9️⃣  Testing LOAD PROJECT DATA endpoint..."
    curl -s -H "Authorization: Bearer $TOKEN" \
         "$BASE_URL/api/projects/$BOARD_ID/load" | jq '.'
    echo -e "\n"

    # Test 10: Create version
    echo "🔟 Testing CREATE VERSION endpoint..."
    VERSION_RESPONSE=$(curl -s -X POST \
         -H "Authorization: Bearer $TOKEN" \
         -H "Content-Type: application/json" \
         -d '{"versionName":"Test Version 1.0"}' \
         "$BASE_URL/api/projects/$BOARD_ID/versions")
    echo "$VERSION_RESPONSE" | jq '.'
    echo -e "\n"

    # Test 11: Get versions
    echo "1️⃣1️⃣  Testing GET VERSIONS endpoint..."
    curl -s -H "Authorization: Bearer $TOKEN" \
         "$BASE_URL/api/projects/$BOARD_ID/versions" | jq '.'
    echo -e "\n"

    # Test 12: Update board
    echo "1️⃣2️⃣  Testing UPDATE BOARD endpoint..."
    curl -s -X PUT \
         -H "Authorization: Bearer $TOKEN" \
         -H "Content-Type: application/json" \
         -d '{"title":"Updated Test Board","isPublic":true}' \
         "$BASE_URL/api/boards/$BOARD_ID" | jq '.'
    echo -e "\n"

    # Test 13: Delete board
    echo "1️⃣3️⃣  Testing DELETE BOARD endpoint..."
    curl -s -X DELETE \
         -H "Authorization: Bearer $TOKEN" \
         "$BASE_URL/api/boards/$BOARD_ID" | jq '.'
    echo -e "\n"
fi

echo "═══════════════════════════════════════════"
echo "  ✅ API TESTING COMPLETE"
echo "═══════════════════════════════════════════"
echo ""
echo "Note: Install 'jq' for better JSON formatting:"
echo "  macOS: brew install jq"
echo "  Linux: apt-get install jq"

