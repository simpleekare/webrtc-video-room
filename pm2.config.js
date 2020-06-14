module.exports = {
  apps : [
      {
        name: "webrtc-app",
        script: "./server.js",
        watch: true,
        env: {
            "PORT": 3000,//any port number
            "NODE_ENV": "production"
        }
      }
  ]
};
