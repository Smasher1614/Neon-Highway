const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("RacingGameModule", (m) => {
  const racingGame = m.contract("RacingGame");

  return { racingGame };
});
