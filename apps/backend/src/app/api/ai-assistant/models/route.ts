import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fetchModels } from '@/lib/ollama';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const ollamaUrl = searchParams.get('ollamaUrl');

  if (!ollamaUrl) {
    // Try to get from user settings
    const settings = await prisma.aiAssistantSetting.findUnique({
      where: { userId: user.id },
    });

    if (!settings || !settings.ollamaUrl) {
      return NextResponse.json(
        { error: 'Ollama URL not provided and no saved settings found' },
        { status: 400 }
      );
    }

    try {
      const models = await fetchModels(settings.ollamaUrl);
      return NextResponse.json({ models });
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Failed to fetch models' },
        { status: 500 }
      );
    }
  }

  try {
    const models = await fetchModels(ollamaUrl);
    return NextResponse.json({ models });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch models' },
      { status: 500 }
    );
  }
}


