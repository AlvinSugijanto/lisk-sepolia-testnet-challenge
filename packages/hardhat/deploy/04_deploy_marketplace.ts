import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployNFTMarketplace: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, get } = hre.deployments;

  // Get the deployed MyNFT contract address
  const myNFT = await get("MyNFT");

  await deploy("NFTMarketplace", {
    from: deployer,
    args: [myNFT.address],
    log: true,
    autoMine: true,
  });
};

export default deployNFTMarketplace;
deployNFTMarketplace.tags = ["NFTMarketplace"];
