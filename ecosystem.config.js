module.exports = {
  apps: [
    {
      name: "smartjeff-web",
      script: "npm",
      args: "start",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "smartjeff-worker",
      script: "npx",
      args: "tsx src/workers/index.ts",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        AUTOMATION_ENABLED: "true",
      },
    },
  ],
};
