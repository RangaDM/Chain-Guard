import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ImageRegistryModule = buildModule("ImageRegistryModule", (m) => {
  const imageRegistry = m.contract("ImageRegistry");

  return { imageRegistry };
});

export default ImageRegistryModule;
