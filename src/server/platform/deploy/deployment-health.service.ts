import { prisma } from "@/lib/prisma";

export interface VersionInfo {
  version: string;
  gitCommit: string;
  buildDate: string;
  environment: string;
  nodeVersion: string;
  platform: string;
}

export class DeploymentHealthService {
  public getVersionInfo(): VersionInfo {
    return {
      version: process.env.APP_VERSION || "25.0.0",
      gitCommit: process.env.GIT_COMMIT_SHA || "1159d4d8",
      buildDate: process.env.BUILD_DATE || new Date().toISOString(),
      environment: process.env.NODE_ENV || "production",
      nodeVersion: process.version,
      platform: process.platform,
    };
  }

  public async recordDeployment(params: {
    version: string;
    gitCommit: string;
    deployedBy?: string;
    environment?: string;
    releaseNotes?: string;
  }) {
    return prisma.deploymentRecord.create({
      data: {
        version: params.version,
        gitCommit: params.gitCommit,
        deployedBy: params.deployedBy || "ci/cd-pipeline",
        environment: params.environment || "production",
        status: "SUCCESS",
        healthCheckStatus: "HEALTHY",
        releaseNotes: params.releaseNotes,
      },
    });
  }

  public async getRecentDeployments(limit = 10) {
    return prisma.deploymentRecord.findMany({
      orderBy: { deployedAt: "desc" },
      take: limit,
    });
  }
}

export const deploymentHealthService = new DeploymentHealthService();
