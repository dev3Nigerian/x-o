const { run } = require("hardhat");

async function main() {
  console.log("🔍 Starting contract verification...");
  
  // Add your deployed addresses here
  const MON_TOKEN_ADDRESS = "YOUR_MON_TOKEN_ADDRESS";
  const GAME_CONTRACT_ADDRESS = "YOUR_GAME_CONTRACT_ADDRESS";

  try {
    await run("verify:verify", {
      address: MON_TOKEN_ADDRESS,
      constructorArguments: []
    });
    
    await run("verify:verify", {
      address: GAME_CONTRACT_ADDRESS,
      constructorArguments: [MON_TOKEN_ADDRESS]
    });
    
    console.log("✅ Contracts verified!");
  } catch (error) {
    console.error("❌ Verification failed:", error);
  }
}

main().catch(console.error);
