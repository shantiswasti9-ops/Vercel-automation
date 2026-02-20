import axios from 'axios';

const JENKINS_URL = process.env.JENKINS_URL || 'http://localhost:8080';
const JENKINS_USER = process.env.JENKINS_USER || '';
const JENKINS_TOKEN = process.env.JENKINS_TOKEN || '';

interface BuildTriggerOptions {
  repo: string;
  branch: string;
  commit: string;
  message: string;
}

interface BuildResult {
  buildNumber?: number;
  queueUrl?: string;
  success: boolean;
}

export async function triggerJenkinsBuild(
  jobName: string,
  options: BuildTriggerOptions,
  patToken?: string
): Promise<BuildResult> {
  if (!JENKINS_USER || !JENKINS_TOKEN) {
    console.warn('Jenkins credentials not configured - build not triggered');
    return { success: false };
  }

  try {
    const auth = {
      username: JENKINS_USER,
      password: JENKINS_TOKEN,
    };

    // Trigger build with parameters
    const triggerUrl = `${JENKINS_URL}/job/${jobName}/buildWithParameters`;
    const params: any = {
      GIT_BRANCH: options.branch,
      GIT_COMMIT: options.commit,
      GIT_URL: options.repo,
      COMMIT_MSG: options.message,
    };

    // Add PAT token to parameters if private repo
    if (patToken) {
      params.GIT_TOKEN = patToken;
    }

    const response = await axios.post(
      triggerUrl,
      null,
      {
        auth,
        params,
        headers: {
          'Jenkins-Crumb': await getJenkinsCrumb(),
        },
      }
    );

    const queueUrl = response.headers.location;
    const buildNumber = extractBuildNumber(queueUrl);

    console.log(`[Jenkins] Build triggered: ${jobName} #${buildNumber}`);

    return {
      success: true,
      buildNumber,
      queueUrl,
    };
  } catch (error) {
    console.error('Jenkins trigger error:', error);
    return { success: false };
  }
}

export async function getJenkinsBuildStatus(
  jobName: string,
  buildNumber: number
): Promise<any> {
  if (!JENKINS_USER || !JENKINS_TOKEN) {
    return { status: 'unknown' };
  }

  try {
    const auth = {
      username: JENKINS_USER,
      password: JENKINS_TOKEN,
    };

    const url = `${JENKINS_URL}/job/${jobName}/${buildNumber}/api/json`;
    const response = await axios.get(url, { auth });

    return response.data;
  } catch (error) {
    console.error('Failed to fetch build status:', error);
    return { status: 'unknown' };
  }
}

async function getJenkinsCrumb(): Promise<string> {
  if (!JENKINS_USER || !JENKINS_TOKEN) {
    return '';
  }

  try {
    const auth = {
      username: JENKINS_USER,
      password: JENKINS_TOKEN,
    };

    const response = await axios.get(
      `${JENKINS_URL}/crumbIssuer/api/xml?xpath=concat(//crumbRequestField,":",//crumb)`,
      { auth }
    );

    return response.data.split(':')[1] || '';
  } catch (error) {
    console.warn('Could not fetch Jenkins crumb');
    return '';
  }
}

function extractBuildNumber(queueUrl: string): number | undefined {
  const match = queueUrl?.match(/\/queue\/item\/(\d+)\//);
  return match ? parseInt(match[1], 10) : undefined;
}

export function getJenkinsJobUrl(jobName: string): string {
  return `${JENKINS_URL}/job/${jobName}`;
}
