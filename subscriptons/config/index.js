const determineConfigDir = () => {
  return process.env.CONFIG_DIR || ".";
};

const determineConfigFile = () => {
  const configDir = determineConfigDir();
  return `${configDir}/config.json`;
};

module.exports = function () {
  const configFile = determineConfigFile();
  return require(configFile);
};
