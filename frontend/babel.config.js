module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Cualquier plugin adicional que necesites
    ],
  };
};
