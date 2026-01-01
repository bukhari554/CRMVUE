const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    host: '0.0.0.0', // Allow access from network
    port: 5050,
    allowedHosts: 'all', // Allow all hosts
    client: {
      webSocketURL: 'auto://0.0.0.0:0/ws'
    }
  }
});

