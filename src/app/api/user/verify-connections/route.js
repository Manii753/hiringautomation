import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';

const SLACK_INVALID_ERRORS = new Set([
  'invalid_auth',
  'token_revoked',
  'token_expired',
  'account_inactive',
  'not_authed',
  'no_permission',
  'missing_scope',
]);

async function checkSlack(token) {
  try {
    const response = await fetch('https://slack.com/api/auth.test', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      return { connected: true, invalid: false };
    }
    const data = await response.json().catch(() => ({}));
    if (data?.ok) {
      return { connected: true, invalid: false };
    }
    const invalid = SLACK_INVALID_ERRORS.has(data?.error);
    return { connected: false, invalid };
  } catch {
    return { connected: true, invalid: false };
  }
}

async function checkClickUp(token) {
  try {
    const response = await fetch('https://api.clickup.com/api/v2/user', {
      headers: { Authorization: token },
    });
    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        connected: true,
        invalid: false,
        user: {
          id: data?.user?.id ?? null,
          username: data?.user?.username ?? null,
          email: data?.user?.email ?? null,
        },
      };
    }
    if (response.status === 401 || response.status === 403) {
      return { connected: false, invalid: true };
    }
    return { connected: true, invalid: false };
  } catch {
    return { connected: true, invalid: false };
  }
}

async function checkManatal(token) {
  try {
    const response = await fetch('https://api.manatal.com/open/v3/organizations/', {
      headers: { Authorization: `Token ${token}` },
    });
    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      const org = data?.results?.[0];
      if (!org) {
        return { connected: false, invalid: true };
      }
      return {
        connected: true,
        invalid: false,
        organization: {
          name: org.name ?? null,
          website: org.website ?? null,
          country: org.country ?? null,
        },
      };
    }
    if (response.status === 401 || response.status === 403) {
      return { connected: false, invalid: true };
    }
    return { connected: true, invalid: false };
  } catch {
    return { connected: true, invalid: false };
  }
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const user = await User.findOne({ email: session.user.email }).lean();
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const [slackResult, clickUpResult, manatalResult] = await Promise.all([
    user.slackAccessToken
      ? checkSlack(user.slackAccessToken)
      : Promise.resolve({ connected: false, invalid: false }),
    user.clickUpAccessToken
      ? checkClickUp(user.clickUpAccessToken)
      : Promise.resolve({ connected: false, invalid: false }),
    user.manatalAccessToken
      ? checkManatal(user.manatalAccessToken)
      : Promise.resolve({ connected: false, invalid: false }),
  ]);

  const unset = {};
  if (slackResult.invalid) {
    unset.slackAccessToken = '';
    unset.slackUserId = '';
    unset.slackTeamId = '';
  }
  if (clickUpResult.invalid) {
    unset.clickUpAccessToken = '';
  }
  if (manatalResult.invalid) {
    unset.manatalAccessToken = '';
  }

  if (Object.keys(unset).length > 0) {
    await User.updateOne({ _id: user._id }, { $unset: unset });
  }

  return NextResponse.json({
    slack: {
      connected: slackResult.connected,
      changed: slackResult.invalid,
    },
    clickUp: {
      connected: clickUpResult.connected,
      changed: clickUpResult.invalid,
      user: clickUpResult.user ?? null,
    },
    manatal: {
      connected: manatalResult.connected,
      changed: manatalResult.invalid,
      organization: manatalResult.organization ?? null,
    },
  });
}
