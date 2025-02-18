#!/bin/bash

printf "\n"
cat <<EOF



          _____                  _______                  _____                   _____                   _____                                 
         /\    \                /::\    \                /\    \                 /\    \                 /\    \                ______          
        /::\    \              /::::\    \              /::\____\               /::\____\               /::\    \              |::|   |         
        \:::\    \            /::::::\    \            /:::/    /              /::::|   |              /::::\    \             |::|   |         
         \:::\    \          /::::::::\    \          /:::/    /              /:::::|   |             /::::::\    \            |::|   |         
          \:::\    \        /:::/~~\:::\    \        /:::/    /              /::::::|   |            /:::/\:::\    \           |::|   |         
           \:::\    \      /:::/    \:::\    \      /:::/____/              /:::/|::|   |           /:::/__\:::\    \          |::|   |         
           /::::\    \    /:::/    / \:::\    \    /::::\    \             /:::/ |::|   |          /::::\   \:::\    \         |::|   |         
  _____   /::::::\    \  /:::/____/   \:::\____\  /::::::\    \   _____   /:::/  |::|   | _____   /::::::\   \:::\    \        |::|   |         
 /\    \ /:::/\:::\    \|:::|    |     |:::|    |/:::/\:::\    \ /\    \ /:::/   |::|   |/\    \ /:::/\:::\   \:::\    \ ______|::|___|___ ____ 
/::\    /:::/  \:::\____|:::|____|     |:::|    /:::/  \:::\    /::\____/:: /    |::|   /::\____/:::/__\:::\   \:::\____|:::::::::::::::::|    |
\:::\  /:::/    \::/    /\:::\    \   /:::/    /\::/    \:::\  /:::/    \::/    /|::|  /:::/    \:::\   \:::\   \::/    |:::::::::::::::::|____|
 \:::\/:::/    / \/____/  \:::\    \ /:::/    /  \/____/ \:::\/:::/    / \/____/ |::| /:::/    / \:::\   \:::\   \/____/ ~~~~~~|::|~~~|~~~      
  \::::::/    /            \:::\    /:::/    /            \::::::/    /          |::|/:::/    /   \:::\   \:::\    \           |::|   |         
   \::::/    /              \:::\__/:::/    /              \::::/    /           |::::::/    /     \:::\   \:::\____\          |::|   |         
    \::/    /                \::::::::/    /               /:::/    /            |:::::/    /       \:::\   \::/    /          |::|   |         
     \/____/                  \::::::/    /               /:::/    /             |::::/    /         \:::\   \/____/           |::|   |         
                               \::::/    /               /:::/    /              /:::/    /           \:::\    \               |::|   |         
                                \::/____/               /:::/    /              /:::/    /             \:::\____\              |::|   |         
                                 ~~                     \::/    /               \::/    /               \::/    /              |::|___|         
                                                         \/____/                 \/____/                 \/____/                ~~              


EOF

printf "\n\n"

# Define colors
GREEN="\e[32m"
RED="\e[31m"
BLUE="\e[34m"
RESET="\e[0m"

# Welcome message
echo -e "Welcome to this installer, brought to you by Johnex @_Johnex on X"

# Install jq if not already installed
if ! command -v jq &> /dev/null; then
    echo -e "${BLUE}jq not found, installing jq...${RESET}"
    # Check for package manager and install jq
    if [ -x "$(command -v apt)" ]; then
        sudo apt update && sudo apt install jq -y
    elif [ -x "$(command -v yum)" ]; then
        sudo yum install jq -y
    elif [ -x "$(command -v brew)" ]; then
        brew install jq
    else
        echo -e "${RED}No compatible package manager found. Please install jq manually.${RESET}"
        exit 1
    fi
    echo -e "${GREEN}jq installed successfully!${RESET}"
else
    echo -e "${GREEN}jq is already installed.${RESET}"
fi

# Install npm if not installed
if ! command -v npm &> /dev/null; then
    echo -e "${BLUE}npm not found, installing npm...${RESET}"
    if [ -x "$(command -v apt)" ]; then
        sudo apt update && sudo apt install npm -y
    elif [ -x "$(command -v brew)" ]; then
        brew install npm
    else
        echo -e "${RED}No compatible package manager found. Please install npm manually.${RESET}"
        exit 1
    fi
    echo -e "${GREEN}npm installed successfully!${RESET}"
else
    echo -e "${GREEN}npm is already installed.${RESET}"
fi

# Check if config.json exists
if [ -f "config.json" ]; then
    echo -e "${BLUE}Found config.json, parsing wallet address...${RESET}"
    WALLET=$(jq -r '.address' config.json)  # Read wallet address from config.json
    echo -e "${GREEN}Wallet address from config.json: $WALLET${RESET}"
else
    # Prompt for wallet address
    read -p "$(echo -e "${BLUE}Enter your wallet address: ${RESET}")" WALLET
fi

# Create a screen session called kite-johnex and run npm run dev
SCREEN_NAME="kite-johnex"
screen -dmS "$SCREEN_NAME" bash -c "
    echo -e '${BLUE}Screen session started: $SCREEN_NAME${RESET}'
    
    echo -e '${GREEN}Running npm run dev...${RESET}'
    npm run dev
    
    # Keep screen session open
    exec bash
"

echo -e "${GREEN}Setup done!${RESET}"
echo -e "${BLUE}Wallet address: $WALLET${RESET}"
echo -e "${BLUE}Created screen session: $SCREEN_NAME${RESET}"
echo -e "${BLUE}Attach to it using: screen -r $SCREEN_NAME${RESET}"
